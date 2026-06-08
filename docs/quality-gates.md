# Quality Gates

## Purpose

Quality gates define when a k6 run should pass or fail. They make performance checks executable in CI instead of leaving results as manual interpretation.

In this project, k6 thresholds are the automated pass/fail criteria.

## Global Gates

| Metric | Purpose | Typical threshold |
|---|---|---|
| `http_req_failed` | Detect unexpected HTTP failures | `< 1-5%` depending on scenario |
| `http_req_duration` | Control response time at percentile level | scenario-specific `p95` and `p99` |
| `checks` | Validate functional API expectations | `> 90-95%` |

If any threshold fails, k6 exits with a non-zero status code and the CI job fails.

## Endpoint Gates

The suite also records endpoint-specific custom metrics:

- `endpoint_list_users_duration`
- `endpoint_list_users_success_rate`
- `endpoint_single_user_duration`
- `endpoint_single_user_success_rate`
- `endpoint_user_not_found_duration`
- `endpoint_user_not_found_success_rate`
- `endpoint_create_user_duration`
- `endpoint_create_user_success_rate`
- `endpoint_login_successful_duration`
- `endpoint_login_successful_success_rate`
- `endpoint_delayed_users_duration`
- `endpoint_delayed_users_success_rate`

Endpoint metrics make it easier to identify which API flow is responsible for a regression.

## Scenario-Specific Policy

### Smoke

Smoke is strict because it has a tiny request count and validates API availability.

Expected behavior:

- checks pass above 95%;
- HTTP failures stay below 1%;
- standard and negative flows stay below 1000 ms at p95;
- delayed endpoint stays below 5000 ms at p95.

### Load

Load is read-heavy and quota-aware.

Expected behavior:

- checks pass above 95%;
- HTTP failures stay below 2%;
- p95 stays below 1200 ms;
- p99 stays below 2000 ms.

### Stress

Stress is more tolerant because it represents higher-than-normal traffic.

Expected behavior:

- checks pass above 90%;
- HTTP failures stay below 5%;
- p95 stays below 2000 ms;
- p99 stays below 3000 ms.

### Spike

Spike is short and read-only.

Expected behavior:

- checks pass above 90%;
- HTTP failures stay below 5%;
- p95 stays below 2000 ms.

## Negative Flow Handling

`GET /api/users/23` is an expected negative case. The expected result is `404`.

The HTTP client configures k6 expected statuses to include this `404`, so a correct negative response does not count as `http_req_failed`.

This is important because the goal is not "all HTTP responses must be 2xx"; the goal is "all API flows must return the expected result."

## Delayed Endpoint Handling

`GET /api/users?delay=3` is intentionally slower than the standard endpoints.

It has a separate threshold so the global smoke threshold does not hide whether standard endpoints are fast while the delayed endpoint behaves as expected.

## When a Gate Fails

Use this triage order:

1. Check the status code pattern.
2. Check the failing endpoint metric.
3. Check whether ReqRes returned `429`, `401`, or `403`.
4. Check whether the failure is isolated or repeated.
5. Compare global metrics with endpoint-specific metrics.

Do not loosen thresholds just to make CI pass. Adjust thresholds only when the test strategy, scenario intent, or public API constraints justify the change.
