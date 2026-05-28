import fs from 'node:fs';

const summaryFile = process.env.K6_SUMMARY_FILE || process.argv[2];
const scenarioName = process.env.SCENARIO_NAME || 'unknown';
const outputFile = process.env.GITHUB_STEP_SUMMARY;

function readSummary(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatNumber(value, digits = 2) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : 'n/a';
}

function formatMs(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2)} ms` : 'n/a';
}

function formatRate(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `${(value * 100).toFixed(2)}%` : 'n/a';
}

function metric(metrics, name) {
  return metrics[name] || {};
}

function endpointName(metricName) {
  return metricName.replace(/^endpoint_/, '').replace(/_duration$/, '');
}

function buildEndpointRows(metrics) {
  return Object.keys(metrics)
    .filter((name) => name.startsWith('endpoint_') && name.endsWith('_duration'))
    .sort()
    .map((durationMetricName) => {
      const endpoint = endpointName(durationMetricName);
      const successMetricName = `endpoint_${endpoint}_success_rate`;
      const duration = metrics[durationMetricName] || {};
      const success = metrics[successMetricName] || {};

      return `| \`${endpoint}\` | ${formatRate(success.value)} | ${formatMs(duration['p(95)'])} | ${formatMs(duration.avg)} | ${formatMs(duration.max)} |`;
    });
}

function buildMarkdown(summary) {
  if (!summary) {
    return [
      '## k6 Summary',
      '',
      `Scenario: \`${scenarioName}\``,
      '',
      'No k6 summary JSON was found. The run may have failed before k6 started.',
      '',
    ].join('\n');
  }

  const metrics = summary.metrics || {};
  const checks = metric(metrics, 'checks');
  const failed = metric(metrics, 'http_req_failed');
  const duration = metric(metrics, 'http_req_duration');
  const requests = metric(metrics, 'http_reqs');
  const iterations = metric(metrics, 'iterations');
  const endpointRows = buildEndpointRows(metrics);

  const lines = [
    '## k6 Summary',
    '',
    `Scenario: \`${scenarioName}\``,
    '',
    '| Metric | Value |',
    '|---|---:|',
    `| Checks pass rate | ${formatRate(checks.value)} |`,
    `| Checks passed | ${checks.passes ?? 'n/a'} |`,
    `| Checks failed | ${checks.fails ?? 'n/a'} |`,
    `| HTTP failure rate | ${formatRate(failed.value)} |`,
    `| HTTP requests | ${requests.count ?? 'n/a'} |`,
    `| Iterations | ${iterations.count ?? 'n/a'} |`,
    `| HTTP duration p95 | ${formatMs(duration['p(95)'])} |`,
    `| HTTP duration p99 | ${formatMs(duration['p(99)'])} |`,
    `| HTTP duration avg | ${formatMs(duration.avg)} |`,
    '',
  ];

  if (endpointRows.length > 0) {
    lines.push('### Endpoint Metrics', '');
    lines.push('| Endpoint | Success rate | p95 | Avg | Max |');
    lines.push('|---|---:|---:|---:|---:|');
    lines.push(...endpointRows);
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

const markdown = buildMarkdown(readSummary(summaryFile));

if (outputFile) {
  fs.appendFileSync(outputFile, markdown);
} else {
  process.stdout.write(markdown);
}
