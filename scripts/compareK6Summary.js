import fs from 'node:fs';

const currentFile = process.env.K6_CURRENT_SUMMARY_FILE || process.env.K6_SUMMARY_FILE || process.argv[2];
const baselineFile = process.env.K6_BASELINE_SUMMARY_FILE || process.argv[3];
const scenarioName = process.env.SCENARIO_NAME || inferScenarioName(currentFile) || inferScenarioName(baselineFile) || 'unknown';
const outputFile = process.env.GITHUB_STEP_SUMMARY;

const policy = {
  durationToleranceMs: readNumberEnv('K6_BASELINE_DURATION_TOLERANCE_MS', 250),
  durationTolerancePercent: readNumberEnv('K6_BASELINE_DURATION_TOLERANCE_PERCENT', 25),
  rateTolerancePoints: readNumberEnv('K6_BASELINE_RATE_TOLERANCE_POINTS', 2),
  failOnRegression: readBooleanEnv('K6_BASELINE_FAIL_ON_REGRESSION', false),
};

function readNumberEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return defaultValue;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) ? value : defaultValue;
}

function readBooleanEnv(name, defaultValue) {
  const rawValue = process.env[name];

  if (!rawValue) {
    return defaultValue;
  }

  return ['1', 'true', 'yes'].includes(rawValue.toLowerCase());
}

function inferScenarioName(filePath) {
  if (!filePath) {
    return null;
  }

  const match = filePath.match(/k6-summary-([a-z-]+)(?:\.baseline)?\.json$/);

  return match ? match[1] : null;
}

function readSummary(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function metric(summary, name) {
  return summary?.metrics?.[name] || {};
}

function value(summary, metricName, fieldName) {
  const metricValue = metric(summary, metricName)[fieldName];

  return typeof metricValue === 'number' && Number.isFinite(metricValue) ? metricValue : null;
}

function formatNumber(metricValue, digits = 2) {
  return typeof metricValue === 'number' && Number.isFinite(metricValue) ? metricValue.toFixed(digits) : 'n/a';
}

function formatMs(metricValue) {
  return typeof metricValue === 'number' && Number.isFinite(metricValue) ? `${metricValue.toFixed(2)} ms` : 'n/a';
}

function formatRate(metricValue) {
  return typeof metricValue === 'number' && Number.isFinite(metricValue) ? `${(metricValue * 100).toFixed(2)}%` : 'n/a';
}

function formatDeltaMs(current, baseline) {
  if (!isNumber(current) || !isNumber(baseline)) {
    return 'n/a';
  }

  const delta = current - baseline;
  const sign = delta > 0 ? '+' : '';

  return `${sign}${delta.toFixed(2)} ms`;
}

function formatDeltaRate(current, baseline) {
  if (!isNumber(current) || !isNumber(baseline)) {
    return 'n/a';
  }

  const delta = (current - baseline) * 100;
  const sign = delta > 0 ? '+' : '';

  return `${sign}${delta.toFixed(2)} pp`;
}

function formatDeltaNumber(current, baseline) {
  if (!isNumber(current) || !isNumber(baseline)) {
    return 'n/a';
  }

  const delta = current - baseline;
  const sign = delta > 0 ? '+' : '';

  return `${sign}${formatNumber(delta, 0)}`;
}

function isNumber(metricValue) {
  return typeof metricValue === 'number' && Number.isFinite(metricValue);
}

function durationResult(current, baseline) {
  if (!isNumber(current) || !isNumber(baseline)) {
    return 'n/a';
  }

  const tolerance = Math.max(policy.durationToleranceMs, baseline * (policy.durationTolerancePercent / 100));
  const delta = current - baseline;

  if (delta > tolerance) {
    return 'regression';
  }

  if (delta < -tolerance) {
    return 'improved';
  }

  return 'stable';
}

function rateResult(current, baseline, direction) {
  if (!isNumber(current) || !isNumber(baseline)) {
    return 'n/a';
  }

  const tolerance = policy.rateTolerancePoints / 100;
  const delta = current - baseline;

  if (direction === 'lower') {
    if (delta > tolerance) {
      return 'regression';
    }

    if (delta < -tolerance) {
      return 'improved';
    }

    return 'stable';
  }

  if (delta < -tolerance) {
    return 'regression';
  }

  if (delta > tolerance) {
    return 'improved';
  }

  return 'stable';
}

function neutralResult(current, baseline) {
  return isNumber(current) && isNumber(baseline) ? 'observed' : 'n/a';
}

function endpointName(metricName) {
  return metricName.replace(/^endpoint_/, '').replace(/_duration$/, '').replace(/_success_rate$/, '');
}

function unionMetricNames(currentSummary, baselineSummary, predicate) {
  const names = new Set([
    ...Object.keys(currentSummary?.metrics || {}),
    ...Object.keys(baselineSummary?.metrics || {}),
  ]);

  return [...names].filter(predicate).sort();
}

function tableRow({ name, baseline, current, delta, result }) {
  return `| ${name} | ${baseline} | ${current} | ${delta} | ${result} |`;
}

function buildGlobalRows(currentSummary, baselineSummary) {
  return [
    tableRow({
      name: '`http_req_duration` p95',
      baseline: formatMs(value(baselineSummary, 'http_req_duration', 'p(95)')),
      current: formatMs(value(currentSummary, 'http_req_duration', 'p(95)')),
      delta: formatDeltaMs(value(currentSummary, 'http_req_duration', 'p(95)'), value(baselineSummary, 'http_req_duration', 'p(95)')),
      result: durationResult(value(currentSummary, 'http_req_duration', 'p(95)'), value(baselineSummary, 'http_req_duration', 'p(95)')),
    }),
    tableRow({
      name: '`http_req_duration` p99',
      baseline: formatMs(value(baselineSummary, 'http_req_duration', 'p(99)')),
      current: formatMs(value(currentSummary, 'http_req_duration', 'p(99)')),
      delta: formatDeltaMs(value(currentSummary, 'http_req_duration', 'p(99)'), value(baselineSummary, 'http_req_duration', 'p(99)')),
      result: durationResult(value(currentSummary, 'http_req_duration', 'p(99)'), value(baselineSummary, 'http_req_duration', 'p(99)')),
    }),
    tableRow({
      name: '`http_req_duration` avg',
      baseline: formatMs(value(baselineSummary, 'http_req_duration', 'avg')),
      current: formatMs(value(currentSummary, 'http_req_duration', 'avg')),
      delta: formatDeltaMs(value(currentSummary, 'http_req_duration', 'avg'), value(baselineSummary, 'http_req_duration', 'avg')),
      result: durationResult(value(currentSummary, 'http_req_duration', 'avg'), value(baselineSummary, 'http_req_duration', 'avg')),
    }),
    tableRow({
      name: '`http_req_failed` rate',
      baseline: formatRate(value(baselineSummary, 'http_req_failed', 'value')),
      current: formatRate(value(currentSummary, 'http_req_failed', 'value')),
      delta: formatDeltaRate(value(currentSummary, 'http_req_failed', 'value'), value(baselineSummary, 'http_req_failed', 'value')),
      result: rateResult(value(currentSummary, 'http_req_failed', 'value'), value(baselineSummary, 'http_req_failed', 'value'), 'lower'),
    }),
    tableRow({
      name: '`checks` pass rate',
      baseline: formatRate(value(baselineSummary, 'checks', 'value')),
      current: formatRate(value(currentSummary, 'checks', 'value')),
      delta: formatDeltaRate(value(currentSummary, 'checks', 'value'), value(baselineSummary, 'checks', 'value')),
      result: rateResult(value(currentSummary, 'checks', 'value'), value(baselineSummary, 'checks', 'value'), 'higher'),
    }),
    tableRow({
      name: '`http_reqs` count',
      baseline: formatNumber(value(baselineSummary, 'http_reqs', 'count'), 0),
      current: formatNumber(value(currentSummary, 'http_reqs', 'count'), 0),
      delta: formatDeltaNumber(value(currentSummary, 'http_reqs', 'count'), value(baselineSummary, 'http_reqs', 'count')),
      result: neutralResult(value(currentSummary, 'http_reqs', 'count'), value(baselineSummary, 'http_reqs', 'count')),
    }),
  ];
}

function buildEndpointDurationRows(currentSummary, baselineSummary) {
  return unionMetricNames(
    currentSummary,
    baselineSummary,
    (name) => name.startsWith('endpoint_') && name.endsWith('_duration'),
  ).map((metricName) => {
    const baseline = value(baselineSummary, metricName, 'p(95)');
    const current = value(currentSummary, metricName, 'p(95)');

    return tableRow({
      name: `\`${endpointName(metricName)}\` p95`,
      baseline: formatMs(baseline),
      current: formatMs(current),
      delta: formatDeltaMs(current, baseline),
      result: durationResult(current, baseline),
    });
  });
}

function buildEndpointSuccessRows(currentSummary, baselineSummary) {
  return unionMetricNames(
    currentSummary,
    baselineSummary,
    (name) => name.startsWith('endpoint_') && name.endsWith('_success_rate'),
  ).map((metricName) => {
    const baseline = value(baselineSummary, metricName, 'value');
    const current = value(currentSummary, metricName, 'value');

    return tableRow({
      name: `\`${endpointName(metricName)}\` success`,
      baseline: formatRate(baseline),
      current: formatRate(current),
      delta: formatDeltaRate(current, baseline),
      result: rateResult(current, baseline, 'higher'),
    });
  });
}

function hasRegression(markdownRows) {
  return markdownRows.some((row) => row.endsWith('| regression |'));
}

function buildMarkdown(currentSummary, baselineSummary) {
  const lines = [
    '## k6 Baseline Comparison',
    '',
    `Scenario: \`${scenarioName}\``,
    `Current summary: \`${currentFile || 'n/a'}\``,
    `Baseline summary: \`${baselineFile || 'n/a'}\``,
    '',
  ];

  if (!currentSummary) {
    lines.push('No current k6 summary JSON was found. Baseline comparison was skipped.', '');
    return { markdown: `${lines.join('\n')}\n`, regressionFound: false };
  }

  if (!baselineSummary) {
    lines.push('No baseline summary was found. Baseline comparison was skipped.', '');
    lines.push('To enable comparison, store a reviewed k6 JSON summary using this naming pattern:', '');
    lines.push(`\`baselines/k6-summary-${scenarioName}.baseline.json\``, '');
    return { markdown: `${lines.join('\n')}\n`, regressionFound: false };
  }

  lines.push('| Policy | Value |');
  lines.push('|---|---:|');
  lines.push(`| Duration tolerance | max(${policy.durationToleranceMs} ms, ${policy.durationTolerancePercent}%) |`);
  lines.push(`| Rate tolerance | ${policy.rateTolerancePoints} percentage points |`);
  lines.push(`| Fail on regression | ${policy.failOnRegression ? 'yes' : 'no'} |`);
  lines.push('');

  const globalRows = buildGlobalRows(currentSummary, baselineSummary);
  const endpointDurationRows = buildEndpointDurationRows(currentSummary, baselineSummary);
  const endpointSuccessRows = buildEndpointSuccessRows(currentSummary, baselineSummary);
  const allComparableRows = [...globalRows, ...endpointDurationRows, ...endpointSuccessRows];

  lines.push('### Global Metrics', '');
  lines.push('| Metric | Baseline | Current | Delta | Result |');
  lines.push('|---|---:|---:|---:|---|');
  lines.push(...globalRows);
  lines.push('');

  if (endpointDurationRows.length > 0) {
    lines.push('### Endpoint Duration p95', '');
    lines.push('| Endpoint | Baseline | Current | Delta | Result |');
    lines.push('|---|---:|---:|---:|---|');
    lines.push(...endpointDurationRows);
    lines.push('');
  }

  if (endpointSuccessRows.length > 0) {
    lines.push('### Endpoint Success Rates', '');
    lines.push('| Endpoint | Baseline | Current | Delta | Result |');
    lines.push('|---|---:|---:|---:|---|');
    lines.push(...endpointSuccessRows);
    lines.push('');
  }

  const regressionFound = hasRegression(allComparableRows);
  lines.push(`Regression result: ${regressionFound ? 'regression detected' : 'no regression detected'}`, '');

  return { markdown: `${lines.join('\n')}\n`, regressionFound };
}

const currentSummary = readSummary(currentFile);
const baselineSummary = readSummary(baselineFile);
const { markdown, regressionFound } = buildMarkdown(currentSummary, baselineSummary);

if (outputFile) {
  fs.appendFileSync(outputFile, markdown);
} else {
  process.stdout.write(markdown);
}

if (regressionFound && policy.failOnRegression) {
  process.exitCode = 1;
}
