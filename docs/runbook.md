# Runbook

## Purpose

This runbook explains how to respond when local or CI k6 runs fail.

It is written for portfolio reviewers and maintainers who want to understand whether a failure is caused by test code, API behavior, quota limits, or environment setup.

## Quick Triage

| Symptom | Likely cause | First action |
|---|---|---|
| `REQRES_API_KEY environment variable is required` | Missing local env var or GitHub Secret | Configure `REQRES_API_KEY` |
| `401` or `403` | Invalid or missing API key | Check secret name and key value |
| `429 rate_limit_exceeded` | ReqRes free-tier quota exhausted | Wait for reset time |
| Checks fail but response time is low | API returned wrong status/body quickly | Inspect status codes and response body |
| `http_req_failed` spikes | Unexpected HTTP statuses or network errors | Check k6 logs and preflight output |
| JSON artifact missing | k6 did not reach summary export | Check preflight and k6 startup errors |

## Local Static Validation

Use this when you want to validate code without spending ReqRes quota:

```powershell
Get-ChildItem -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch "\\node_modules\\" } |
  ForEach-Object { node --check $_.FullName }

k6 inspect scenarios/smoke.js
k6 inspect scenarios/load.js
k6 inspect scenarios/stress.js
k6 inspect scenarios/spike.js
```

## Local Smoke Run

Use smoke first when quota is available:

```powershell
$env:REQRES_API_KEY="your-api-key"
k6 run --summary-export results/k6-summary-smoke.json scenarios/smoke.js
```

Expected result:

- checks: 100% or above threshold;
- `http_req_failed`: 0%;
- JSON summary file exists in `results/`.

## GitHub Actions Failure: `429`

Meaning:

ReqRes daily quota is exhausted.

Expected workflow behavior:

- preflight fails early;
- error message includes reset time when available;
- k6 scenario does not continue.

Action:

- wait until reset;
- avoid rerunning manual load-style scenarios repeatedly;
- use static validation for code checks.

## GitHub Actions Failure: `401` or `403`

Meaning:

ReqRes rejected the API key.

Action:

- check GitHub repository secret name: `REQRES_API_KEY`;
- verify the key is current in ReqRes dashboard;
- ensure the code sends the `x-api-key` header.

## Threshold Failure

Meaning:

k6 completed the run, but one or more quality gates failed.

Action:

1. Open the GitHub Actions step summary.
2. Check global metrics:
   - checks pass rate;
   - HTTP failure rate;
   - p95 and p99 duration.
3. Check endpoint metrics.
4. Decide whether the failure is:
   - a test expectation issue;
   - a ReqRes quota or WAF issue;
   - a public API availability issue;
   - a real endpoint behavior change.

## Manual Scenario Guidance

Recommended order:

1. Run `smoke`.
2. Run one load-style scenario only if needed.
3. Avoid running `load`, `stress`, and `spike` repeatedly on the same day.

The project is designed to show performance testing discipline, not to consume the full ReqRes free-tier quota.

## Artifact Review

CI uploads JSON summaries from `results/*.json`.

Use artifacts when you need:

- exact metric values;
- endpoint-level custom metrics;
- historical comparison between runs;
- evidence for a PR discussion.
