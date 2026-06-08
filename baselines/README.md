# Baselines

## Purpose

This directory is reserved for reviewed k6 JSON summaries that can be used as comparison baselines.

Baseline comparison helps reviewers answer a more mature performance question:

```text
Did the latest run materially change compared with an accepted previous run?
```

## Naming Convention

Use this file name pattern:

```text
baselines/k6-summary-<scenario>.baseline.json
```

Examples:

```text
baselines/k6-summary-smoke.baseline.json
baselines/k6-summary-load.baseline.json
baselines/k6-summary-stress.baseline.json
baselines/k6-summary-spike.baseline.json
```

## Creating A Baseline

Only promote a summary to baseline after reviewing that the run is healthy and representative.

Example:

```powershell
$env:REQRES_API_KEY="your-api-key"
k6 run --summary-export results/k6-summary-smoke.json scenarios/smoke.js
Copy-Item results/k6-summary-smoke.json baselines/k6-summary-smoke.baseline.json
```

Do not create baselines from failed runs, quota-limited runs, or runs affected by obvious network incidents.

## CI Behavior

The GitHub Actions workflow looks for:

```text
baselines/k6-summary-${scenario}.baseline.json
```

If the file exists, CI adds a baseline comparison section to the GitHub Actions step summary.

If the file does not exist, CI skips baseline comparison without failing the job. This keeps baseline adoption incremental and avoids blocking normal smoke validation.

For local no-network comparison, use:

```bash
npm run report:compare:smoke
npm run report:compare:load
npm run report:compare:stress
npm run report:compare:spike
```

## Regression Policy

The comparison script uses conservative default tolerances:

| Policy | Default |
|---|---:|
| Duration tolerance | max(250 ms, 25%) |
| Rate tolerance | 2 percentage points |
| Fail on regression | disabled |

Baseline comparison is informational by default because ReqRes is an external public API. Network noise, public service controls, WAF behavior, and daily quota state can affect results.

To make comparison fail the job, set:

```text
K6_BASELINE_FAIL_ON_REGRESSION=true
```

This should be enabled only when baseline stability is proven for the target environment.
