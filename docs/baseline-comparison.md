# Baseline Comparison

## Purpose

Baseline comparison adds a lightweight regression review layer on top of k6 thresholds.

Thresholds answer:

```text
Did this run meet the current quality gate?
```

Baseline comparison answers:

```text
Did this run materially change compared with an accepted previous run?
```

This is useful because a run can pass thresholds while still showing a meaningful latency increase or success-rate drop.

## How It Works

The workflow exports the current k6 summary to:

```text
results/k6-summary-<scenario>.json
```

Then `scripts/compareK6Summary.js` looks for a reviewed baseline at:

```text
baselines/k6-summary-<scenario>.baseline.json
```

If both files exist, the script writes a Markdown comparison to the GitHub Actions step summary.

If the baseline file does not exist, the comparison step is skipped without failing the job.

## Compared Metrics

The comparison includes:

- global `http_req_duration` p95, p99, and average;
- global `http_req_failed` rate;
- global `checks` pass rate;
- total `http_reqs` count;
- endpoint-specific p95 duration metrics;
- endpoint-specific success-rate metrics.

## Validation

The comparison script is validated with local fixtures and does not require a ReqRes API key:

```bash
npm run validate:baseline-comparison
```

The validation covers:

- stable current summary compared with baseline;
- missing baseline behavior;
- regression behavior when `K6_BASELINE_FAIL_ON_REGRESSION=true`.

## Default Tolerances

| Metric type | Default tolerance |
|---|---:|
| Duration metrics | max(250 ms, 25%) |
| Rate metrics | 2 percentage points |

Duration metrics are marked as regression when the current value is higher than baseline by more than the tolerance.

Success-rate metrics are marked as regression when the current value is lower than baseline by more than the tolerance.

HTTP failure rate is marked as regression when the current value is higher than baseline by more than the tolerance.

## Informational By Default

The comparison step does not fail CI by default.

This is intentional. ReqRes is a public shared API, so latency and rate behavior can be affected by:

- external network conditions;
- daily free-tier quota state;
- service-side rate limits or WAF controls;
- public API availability.

The main CI gate remains k6 thresholds. Baseline comparison is an additional review signal.

## Enabling Regression Failure

The comparison script can fail on regression by setting:

```text
K6_BASELINE_FAIL_ON_REGRESSION=true
```

Optional tolerance overrides:

```text
K6_BASELINE_DURATION_TOLERANCE_MS=250
K6_BASELINE_DURATION_TOLERANCE_PERCENT=25
K6_BASELINE_RATE_TOLERANCE_POINTS=2
```

For this project, keep fail-on-regression disabled until baseline stability is proven across several clean runs.

## Promoting A Baseline

Promote a run to baseline only when:

- the k6 run passed thresholds;
- no `429`, `401`, or `403` behavior was observed;
- endpoint metrics look representative;
- the run was not affected by obvious network issues;
- the scenario request budget did not accidentally change.

Example:

```powershell
Copy-Item results/k6-summary-smoke.json baselines/k6-summary-smoke.baseline.json
```

Review baseline changes like test code changes. A baseline update changes how future regressions are interpreted.
