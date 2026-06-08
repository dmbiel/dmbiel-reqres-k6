import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reportScript = path.join(rootDir, 'scripts', 'writeHtmlReport.js');
const fixtureSummary = path.join(rootDir, 'tests', 'fixtures', 'baseline-comparison', 'k6-summary-smoke.current-stable.json');
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'k6-html-report-'));

const cases = [
  {
    name: 'HTML report is generated from a k6 summary',
    args: [fixtureSummary, path.join(tempDir, 'k6-summary-smoke.html')],
    env: {
      SCENARIO_NAME: 'smoke',
    },
    expectedStatus: 0,
    expectedOutputFile: path.join(tempDir, 'k6-summary-smoke.html'),
    expectedHtml: [
      '<title>k6 HTML Report - smoke</title>',
      'Checks pass rate',
      'HTTP duration p95',
      '<code>list_users</code>',
      'Visual status colors are review aids only.',
    ],
  },
  {
    name: 'missing summary still writes an explanatory HTML report',
    args: [path.join(tempDir, 'missing-summary.json'), path.join(tempDir, 'missing-summary.html')],
    expectedStatus: 0,
    expectedOutputFile: path.join(tempDir, 'missing-summary.html'),
    expectedHtml: [
      '<title>k6 HTML Report - unknown</title>',
      'No k6 summary JSON was found.',
    ],
  },
];

function runCase(testCase) {
  const result = spawnSync(process.execPath, [reportScript, ...testCase.args], {
    cwd: rootDir,
    env: {
      ...process.env,
      ...(testCase.env || {}),
    },
    encoding: 'utf8',
  });

  if (result.status !== testCase.expectedStatus) {
    throw new Error(
      [
        `${testCase.name} failed: expected exit ${testCase.expectedStatus}, got ${result.status}`,
        result.stdout,
        result.stderr,
      ].join('\n'),
    );
  }

  if (!fs.existsSync(testCase.expectedOutputFile)) {
    throw new Error(`${testCase.name} failed: expected report file was not created`);
  }

  const html = fs.readFileSync(testCase.expectedOutputFile, 'utf8');

  for (const expectedText of testCase.expectedHtml) {
    if (!html.includes(expectedText)) {
      throw new Error(
        [
          `${testCase.name} failed: expected HTML to include:`,
          expectedText,
          '',
          'Actual HTML:',
          html,
        ].join('\n'),
      );
    }
  }

  process.stdout.write(`[pass] ${testCase.name}\n`);
}

try {
  for (const testCase of cases) {
    runCase(testCase);
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
