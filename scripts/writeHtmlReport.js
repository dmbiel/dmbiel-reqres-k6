import fs from 'node:fs';
import path from 'node:path';

const summaryFile = process.env.K6_SUMMARY_FILE || process.argv[2];
const outputFile = process.env.K6_HTML_REPORT_FILE || process.argv[3] || defaultOutputFile(summaryFile);
const scenarioName = process.env.SCENARIO_NAME || inferScenarioName(summaryFile) || 'unknown';

function defaultOutputFile(filePath) {
  if (!filePath) {
    return null;
  }

  return filePath.replace(/\.json$/i, '.html');
}

function inferScenarioName(filePath) {
  if (!filePath) {
    return null;
  }

  const normalizedPath = filePath.replace(/\\/g, '/');
  const match = normalizedPath.match(/k6-summary-([a-z-]+)(?:\.baseline)?\.json$/);

  return match ? match[1] : null;
}

function readSummary(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function metric(metrics, name) {
  return metrics[name] || {};
}

function endpointName(metricName) {
  return metricName.replace(/^endpoint_/, '').replace(/_duration$/, '');
}

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatNumber(value, digits = 2) {
  return isNumber(value) ? value.toFixed(digits) : 'n/a';
}

function formatMs(value) {
  return isNumber(value) ? `${value.toFixed(2)} ms` : 'n/a';
}

function formatRate(value) {
  return isNumber(value) ? `${(value * 100).toFixed(2)}%` : 'n/a';
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusClassForRate(value, direction = 'higher') {
  if (!isNumber(value)) {
    return 'neutral';
  }

  if (direction === 'lower') {
    if (value <= 0.01) {
      return 'good';
    }

    if (value <= 0.05) {
      return 'warn';
    }

    return 'bad';
  }

  if (value >= 0.95) {
    return 'good';
  }

  if (value >= 0.9) {
    return 'warn';
  }

  return 'bad';
}

function statusClassForDuration(value) {
  if (!isNumber(value)) {
    return 'neutral';
  }

  if (value <= 1000) {
    return 'good';
  }

  if (value <= 2000) {
    return 'warn';
  }

  return 'bad';
}

function buildMetricCard(label, value, statusClass) {
  return [
    `<article class="metric-card ${statusClass}">`,
    `  <div class="metric-label">${escapeHtml(label)}</div>`,
    `  <div class="metric-value">${escapeHtml(value)}</div>`,
    '</article>',
  ].join('\n');
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

      return [
        '<tr>',
        `  <td><code>${escapeHtml(endpoint)}</code></td>`,
        `  <td class="${statusClassForRate(success.value)}">${escapeHtml(formatRate(success.value))}</td>`,
        `  <td class="${statusClassForDuration(duration['p(95)'])}">${escapeHtml(formatMs(duration['p(95)']))}</td>`,
        `  <td>${escapeHtml(formatMs(duration.avg))}</td>`,
        `  <td>${escapeHtml(formatMs(duration.max))}</td>`,
        '</tr>',
      ].join('\n');
    });
}

function buildCheckRows(summary) {
  const checks = summary?.root_group?.checks || {};

  return Object.values(checks)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((check) => {
      const passes = check.passes ?? 0;
      const fails = check.fails ?? 0;
      const total = passes + fails;
      const passRate = total > 0 ? passes / total : null;

      return [
        '<tr>',
        `  <td>${escapeHtml(check.name)}</td>`,
        `  <td>${escapeHtml(passes)}</td>`,
        `  <td>${escapeHtml(fails)}</td>`,
        `  <td class="${statusClassForRate(passRate)}">${escapeHtml(formatRate(passRate))}</td>`,
        '</tr>',
      ].join('\n');
    });
}

function buildMetricCards(metrics) {
  const checks = metric(metrics, 'checks');
  const failed = metric(metrics, 'http_req_failed');
  const duration = metric(metrics, 'http_req_duration');
  const requests = metric(metrics, 'http_reqs');
  const iterations = metric(metrics, 'iterations');

  return [
    buildMetricCard('Checks pass rate', formatRate(checks.value), statusClassForRate(checks.value)),
    buildMetricCard('HTTP failure rate', formatRate(failed.value), statusClassForRate(failed.value, 'lower')),
    buildMetricCard('HTTP requests', formatNumber(requests.count, 0), 'neutral'),
    buildMetricCard('Iterations', formatNumber(iterations.count, 0), 'neutral'),
    buildMetricCard('HTTP duration p95', formatMs(duration['p(95)']), statusClassForDuration(duration['p(95)'])),
    buildMetricCard('HTTP duration p99', formatMs(duration['p(99)']), statusClassForDuration(duration['p(99)'])),
    buildMetricCard('HTTP duration avg', formatMs(duration.avg), statusClassForDuration(duration.avg)),
  ].join('\n');
}

function buildReport(summary) {
  const generatedAt = new Date().toISOString();
  const escapedScenario = escapeHtml(scenarioName);

  if (!summary) {
    return htmlDocument({
      title: `k6 HTML Report - ${scenarioName}`,
      body: [
        '<main class="shell">',
        '<section class="hero">',
        `<p class="eyebrow">Grafana k6 report</p>`,
        `<h1>${escapedScenario}</h1>`,
        `<p>No k6 summary JSON was found. The run may have failed before k6 exported a summary.</p>`,
        '</section>',
        '</main>',
      ].join('\n'),
    });
  }

  const metrics = summary.metrics || {};
  const endpointRows = buildEndpointRows(metrics);
  const checkRows = buildCheckRows(summary);

  return htmlDocument({
    title: `k6 HTML Report - ${scenarioName}`,
    body: [
      '<main class="shell">',
      '<section class="hero">',
      '<p class="eyebrow">Grafana k6 report</p>',
      `<h1>${escapedScenario}</h1>`,
      `<p>Generated at ${escapeHtml(generatedAt)} from ${escapeHtml(summaryFile || 'unknown summary file')}.</p>`,
      '</section>',
      '<section class="metric-grid" aria-label="Summary metrics">',
      buildMetricCards(metrics),
      '</section>',
      endpointRows.length > 0
        ? [
            '<section class="panel">',
            '<h2>Endpoint Metrics</h2>',
            '<table>',
            '<thead><tr><th>Endpoint</th><th>Success rate</th><th>p95</th><th>Avg</th><th>Max</th></tr></thead>',
            '<tbody>',
            ...endpointRows,
            '</tbody>',
            '</table>',
            '</section>',
          ].join('\n')
        : '',
      checkRows.length > 0
        ? [
            '<section class="panel">',
            '<h2>Checks</h2>',
            '<table>',
            '<thead><tr><th>Check</th><th>Passed</th><th>Failed</th><th>Pass rate</th></tr></thead>',
            '<tbody>',
            ...checkRows,
            '</tbody>',
            '</table>',
            '</section>',
          ].join('\n')
        : '',
      '<section class="note">',
      '<p>Visual status colors are review aids only. k6 thresholds remain the source of truth for CI pass/fail behavior.</p>',
      '</section>',
      '</main>',
    ].join('\n'),
  });
}

function htmlDocument({ title, body }) {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${escapeHtml(title)}</title>`,
    '  <style>',
    '    :root { color-scheme: light; --bg: #f5f7fb; --surface: #ffffff; --text: #111827; --muted: #5b6472; --line: #d9e0ea; --good: #0f7b4a; --good-bg: #e7f6ef; --warn: #996b00; --warn-bg: #fff4d6; --bad: #b42318; --bad-bg: #fde8e7; --accent: #315cfd; }',
    '    * { box-sizing: border-box; }',
    '    body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }',
    '    .shell { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 32px 0 48px; }',
    '    .hero { padding: 28px 0 20px; }',
    '    .eyebrow { margin: 0 0 8px; color: var(--accent); font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }',
    '    h1 { margin: 0; font-size: clamp(32px, 5vw, 56px); line-height: 1.02; letter-spacing: 0; }',
    '    h2 { margin: 0 0 16px; font-size: 20px; }',
    '    p { max-width: 760px; margin: 12px 0 0; color: var(--muted); }',
    '    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 24px 0; }',
    '    .metric-card { min-height: 108px; padding: 18px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); }',
    '    .metric-label { color: var(--muted); font-size: 13px; font-weight: 650; }',
    '    .metric-value { margin-top: 12px; font-size: 28px; font-weight: 760; letter-spacing: 0; }',
    '    .panel, .note { margin-top: 18px; padding: 20px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); overflow-x: auto; }',
    '    table { width: 100%; border-collapse: collapse; min-width: 680px; }',
    '    th, td { padding: 11px 10px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }',
    '    th { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }',
    '    code { font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace; font-size: .95em; }',
    '    .good { color: var(--good); background: var(--good-bg); }',
    '    .warn { color: var(--warn); background: var(--warn-bg); }',
    '    .bad { color: var(--bad); background: var(--bad-bg); }',
    '    td.good, td.warn, td.bad { font-weight: 700; }',
    '    .neutral { color: var(--text); }',
    '    @media (max-width: 640px) { .shell { width: min(100% - 20px, 1120px); padding-top: 18px; } .metric-card { min-height: 96px; } .metric-value { font-size: 23px; } }',
    '  </style>',
    '</head>',
    '<body>',
    body,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

const html = buildReport(readSummary(summaryFile));

if (outputFile) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, html);
} else {
  process.stdout.write(html);
}
