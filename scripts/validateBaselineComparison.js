import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const compareScript = path.join(rootDir, 'scripts', 'compareK6Summary.js');
const fixturesDir = path.join(rootDir, 'tests', 'fixtures', 'baseline-comparison');

const baselineFile = path.join(fixturesDir, 'k6-summary-smoke.baseline.json');
const stableFile = path.join(fixturesDir, 'k6-summary-smoke.current-stable.json');
const regressionFile = path.join(fixturesDir, 'k6-summary-smoke.current-regression.json');
const missingBaselineFile = path.join(fixturesDir, 'k6-summary-smoke.missing-baseline.json');

const cases = [
  {
    name: 'stable comparison exits successfully',
    args: [stableFile, baselineFile],
    env: {
      SCENARIO_NAME: 'smoke',
      K6_BASELINE_FAIL_ON_REGRESSION: 'true',
    },
    expectedStatus: 0,
    expectedOutput: [
      'Regression result: no regression detected',
      '| `http_req_duration` p95 | 200.00 ms | 210.00 ms | +10.00 ms | stable |',
    ],
  },
  {
    name: 'missing baseline exits successfully',
    args: [stableFile, missingBaselineFile],
    env: {
      SCENARIO_NAME: 'smoke',
      K6_BASELINE_FAIL_ON_REGRESSION: 'true',
    },
    expectedStatus: 0,
    expectedOutput: [
      'No baseline summary was found. Baseline comparison was skipped.',
      '`baselines/k6-summary-smoke.baseline.json`',
    ],
  },
  {
    name: 'regression exits with non-zero status when fail-on-regression is enabled',
    args: [regressionFile, baselineFile],
    env: {
      SCENARIO_NAME: 'smoke',
      K6_BASELINE_FAIL_ON_REGRESSION: 'true',
    },
    expectedStatus: 1,
    expectedOutput: [
      'Regression result: regression detected',
      '| `http_req_duration` p95 | 200.00 ms | 800.00 ms | +600.00 ms | regression |',
      '| `checks` pass rate | 100.00% | 90.00% | -10.00 pp | regression |',
    ],
  },
];

function runCase(testCase) {
  const result = spawnSync(process.execPath, [compareScript, ...testCase.args], {
    cwd: rootDir,
    env: {
      ...process.env,
      GITHUB_STEP_SUMMARY: '',
      ...testCase.env,
    },
    encoding: 'utf8',
  });

  const output = `${result.stdout}${result.stderr}`;

  if (result.status !== testCase.expectedStatus) {
    throw new Error(
      [
        `${testCase.name} failed: expected exit ${testCase.expectedStatus}, got ${result.status}`,
        output,
      ].join('\n'),
    );
  }

  for (const expectedText of testCase.expectedOutput) {
    if (!output.includes(expectedText)) {
      throw new Error(
        [
          `${testCase.name} failed: expected output to include:`,
          expectedText,
          '',
          'Actual output:',
          output,
        ].join('\n'),
      );
    }
  }

  process.stdout.write(`[pass] ${testCase.name}\n`);
}

for (const testCase of cases) {
  runCase(testCase);
}
