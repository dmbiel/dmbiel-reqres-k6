# Performance Test Strategy

## Purpose

This project demonstrates a Lead QA Automation approach to API performance testing with Grafana k6 against ReqRes.

The purpose is not to benchmark ReqRes infrastructure. ReqRes is a shared public API, so the test suite is intentionally lightweight, quota-aware, and conservative.

The project demonstrates:

- reusable k6 architecture;
- scenario separation by test intent;
- checks for API correctness;
- thresholds as automated quality gates;
- endpoint-level metrics;
- CI integration with readable reporting;
- optional baseline comparison for regression review;
- secret handling through environment variables and GitHub Secrets;
- explicit public API risk management.

## Goals

- Validate that key ReqRes API flows return expected status codes and response fields.
- Measure response time trends for standard, negative, delayed, and read-heavy flows.
- Provide automated pass/fail signals through k6 thresholds.
- Compare current results against reviewed baselines when available.
- Keep CI output understandable for both QA and engineering reviewers.
- Prevent accidental overuse of a shared public API.

## Non-Goals

- Benchmarking ReqRes production infrastructure.
- Testing high concurrency or high request volume.
- Proving ReqRes scalability limits.
- Replacing contract tests, schema validation, or functional API test suites.
- Persisting or validating real business data.

## Scope

The test suite covers these API flows:

| Flow | Endpoint | Method | Scenario usage |
|---|---|---:|---|
| List users | `/api/users?page=1` | GET | Smoke, load, stress, spike |
| Single user | `/api/users/2` | GET | Smoke, load, stress |
| User not found | `/api/users/23` | GET | Smoke |
| Create user | `/api/users` | POST | Smoke |
| Login successful | `/api/login` | POST | Smoke |
| Delayed response | `/api/users?delay=3` | GET | Smoke |

Write-like and auth-like endpoints are intentionally kept out of repeated load-style loops. They are validated in smoke coverage only.

## Assumptions

- ReqRes API behavior is stable and predictable for sample endpoints.
- The API key is provided through `REQRES_API_KEY`.
- CI has access to the `REQRES_API_KEY` GitHub secret.
- External network latency and ReqRes-side controls can affect results.
- The daily free-tier quota can be exhausted by repeated manual runs.

## Scenario Model

### Smoke

Smoke validates API availability, key configuration, status codes, response fields, the negative `404` flow, and the delayed endpoint.

Smoke is the main automatic PR quality gate.

### Load

Load uses a conservative read-heavy arrival-rate model. It validates average behavior with a small request budget.

### Stress

Stress increases read request arrival rate above the load profile while staying within a public API-safe request budget.

### Spike

Spike validates a short request-rate increase with only the list-users endpoint.

## Entry Criteria

- `REQRES_API_KEY` is configured.
- Static validation passes:
  - `node --check`;
  - `k6 inspect`.
- The target API is reachable.
- ReqRes daily quota is available.

## Exit Criteria

- Required checks pass.
- Required thresholds pass.
- JSON summary artifact is uploaded in CI.
- GitHub Actions step summary is readable and includes key metrics.
- Failures are triaged as test defects, environment issues, quota issues, or API behavior changes.

## Risk Management

| Risk | Mitigation |
|---|---|
| Daily quota exhaustion | Small request budgets, preflight check, manual run guidance |
| WAF or rate-limit behavior | Conservative arrival rates and read-heavy load scenarios |
| False negatives from expected `404` | k6 expected statuses include the negative-flow `404` |
| Secret leakage | API key comes from env or GitHub Secrets only |
| Noisy CI output | GitHub Actions step summary and JSON artifacts |

## Interpretation Guidance

Failing thresholds are not automatically product bugs. For a public API target, failures should be interpreted with context:

- `429` usually means quota exhaustion.
- `401` or `403` usually means API key configuration issues.
- isolated latency spikes may be network or public service noise;
- repeated endpoint-specific failures suggest a real flow issue or a test expectation mismatch.

The goal is to show controlled performance testing discipline, not to produce high-volume traffic.
