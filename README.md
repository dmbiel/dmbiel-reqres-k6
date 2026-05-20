# dmbiel-reqres-k6

## Overview

This repository demonstrates API performance testing using Grafana k6 against the ReqRes API.

The project focuses on:

- reusable k6 test structure;
- smoke, load, stress, and spike scenarios;
- response validation with checks;
- performance quality gates with thresholds;
- GitHub Actions integration;
- safe secret management for API keys.

This project is designed as a lightweight public API performance testing example.
It intentionally avoids high traffic volumes because ReqRes is a shared public API.
The goal is to demonstrate k6 test architecture, checks, thresholds, scenarios, and CI integration - not to benchmark ReqRes infrastructure.

## Why this project exists

Performance testing portfolio projects often stop at a single script that sends requests. This repository is structured to show a more production-like QA approach:

- clear separation between configuration, reusable helpers, test flows, and scenarios;
- pass/fail criteria defined as k6 thresholds;
- API response validation through checks;
- CI execution with GitHub Actions;
- API key handling through environment variables and GitHub Secrets.

## Tech stack

| Area | Tool |
|---|---|
| Runtime | Grafana k6 |
| Language | JavaScript ES modules |
| CI | GitHub Actions |
| Target API | ReqRes |
| Reports | k6 console summary and JSON summary artifact |

## Tested API

Base URL: `https://reqres.in`

| Flow | Endpoint | Method | Purpose |
|---|---|---:|---|
| List users | `/api/users?page=1` | GET | Baseline read operation |
| Single user | `/api/users/2` | GET | Individual resource lookup |
| User not found | `/api/users/23` | GET | Negative status validation |
| Create user | `/api/users` | POST | Simple write-like request |
| Login successful | `/api/login` | POST | Auth-like request |
| Delayed response | `/api/users?delay=3` | GET | Slow endpoint scenario |

All requests include:

- `x-api-key`
- `X-Reqres-Env: prod`
- `Content-Type: application/json`
- `User-Agent: dmbiel-reqres-k6/1.0`

## Test strategy

The test strategy follows a lightweight non-functional testing model:

1. Smoke test

   Validates that the API is reachable, authentication headers are configured correctly, and key endpoints return expected responses.

2. Load test

   Simulates a small, stable, read-heavy request rate to validate average API behavior.

3. Stress test

   Gradually increases request arrival rate to observe behavior under higher-than-normal traffic without exhausting the public API quota.

4. Spike test

   Simulates a short request-rate increase to observe short-term response behavior.

Because ReqRes is a public shared API with a free-tier daily request limit, the scenarios intentionally use conservative traffic levels. Repeated write-like and auth-like requests are kept in the smoke scenario only; the load, stress, and spike scenarios are read-heavy and rate-limited to reduce the risk of quota exhaustion, rate limits, or WAF blocks.

## Repository structure

```text
dmbiel-reqres-k6/
|-- .github/
|   `-- workflows/
|       `-- k6.yml
|-- config/
|   `-- environments.js
|-- data/
|   `-- users.json
|-- helpers/
|   |-- checks.js
|   |-- httpClient.js
|   `-- summary.js
|-- scenarios/
|   |-- smoke.js
|   |-- load.js
|   |-- stress.js
|   `-- spike.js
|-- tests/
|   |-- getUsers.test.js
|   |-- getSingleUser.test.js
|   |-- createUser.test.js
|   |-- login.test.js
|   `-- delayedResponse.test.js
|-- results/
|   `-- .gitkeep
|-- .gitignore
|-- README.md
`-- package.json
```

## Prerequisites

- k6 installed locally
- ReqRes API key
- GitHub repository secret named `REQRES_API_KEY` for CI runs

Install k6 using the official Grafana k6 installation guide for your operating system.

## Environment variables

| Variable | Required | Description |
|---|---:|---|
| `REQRES_API_KEY` | Yes | API key used in the `x-api-key` header |
| `ENVIRONMENT` | No | Target environment. Default: `prod` |

The API key is never stored in this repository.

Use `.env.example` as a local template:

```text
REQRES_API_KEY=your-api-key
ENVIRONMENT=prod
```

Keep the real `.env` file local only. It is ignored by Git.

## How to run locally

Bash:

```bash
export REQRES_API_KEY="your-api-key"

k6 run scenarios/smoke.js
k6 run scenarios/load.js
k6 run scenarios/stress.js
k6 run scenarios/spike.js
```

Windows PowerShell:

```powershell
$env:REQRES_API_KEY="your-api-key"

k6 run scenarios/smoke.js
k6 run scenarios/load.js
k6 run scenarios/stress.js
k6 run scenarios/spike.js
```

Using npm scripts:

```bash
npm run test:smoke
npm run test:load
npm run test:stress
npm run test:spike
```

The npm scripts export JSON summaries into the `results/` directory.

## Available scenarios

| Scenario | Command | Purpose | Traffic model | Approx. requests |
|---|---|---|---|---:|
| Smoke | `k6 run scenarios/smoke.js` | API availability, key validation, main flows, delayed endpoint coverage | 1 VU, 1 iteration | 6 |
| Load | `k6 run scenarios/load.js` | Conservative read-heavy average load profile | Ramping arrival rate, max 3 VUs | ~25 |
| Stress | `k6 run scenarios/stress.js` | Controlled higher-than-normal traffic | Ramping arrival rate, max 5 VUs | ~30 |
| Spike | `k6 run scenarios/spike.js` | Short traffic increase | Ramping arrival rate, max 4 VUs | ~10 |

## Thresholds and quality gates

Thresholds are used as automated quality gates.

Current default thresholds:

- HTTP error rate should stay below 1-5%, depending on scenario.
- 95th percentile response time should stay below defined scenario-specific limits.
- k6 checks should pass in at least 90-95% of cases.
- The smoke scenario has separate response-time thresholds for standard, negative, and delayed flows.

The load, stress, and spike scenarios intentionally focus on read endpoints and use request-rate executors with small request budgets. This keeps repeated traffic against ReqRes conservative while still demonstrating scenario modeling, thresholds, checks, and CI quality gates.

If a threshold fails, k6 exits with a non-zero status code, which fails the CI pipeline.

The `GET /api/users/23` flow is an expected negative check. The HTTP client configures k6 expected statuses so the expected `404` does not count as an HTTP request failure, while unexpected `401`, `403`, and `5xx` responses still fail quality gates.

## GitHub Actions CI

The workflow in `.github/workflows/k6.yml` runs two jobs:

- `Static validation`
  - validates JavaScript syntax with `node --check`;
  - validates k6 scenario configuration with `k6 inspect`;
  - does not call ReqRes and does not consume API quota.
- `Run k6 tests`
  - runs the selected k6 scenario;
  - uses `REQRES_API_KEY` from GitHub Secrets;
  - exports and uploads a JSON summary artifact.

The k6 test job runs the smoke scenario on:

- pull requests targeting `main`;
- pull requests marked ready for review.

It does not run again on `push` to `main` after a PR merge. This avoids spending ReqRes quota twice for the same change: once on the PR and once again on the merge commit.

Draft pull requests run static validation only. The quota-consuming k6 job starts when the PR is ready for review.

Manual runs are supported through `workflow_dispatch`, with scenario selection:

- `smoke`
- `load`
- `stress`
- `spike`

Before enabling CI, add the API key as a GitHub Actions repository secret:

```text
REQRES_API_KEY
```

The workflow uses `grafana/setup-k6-action`, runs a ReqRes preflight check, runs k6, writes a JSON summary to `results/`, and uploads the summary as a GitHub Actions artifact.

The preflight step fails early with a clear message if ReqRes returns `429 rate_limit_exceeded`, `401`, or `403`. This prevents a quota issue from looking like a broken k6 script. The preflight request also consumes one ReqRes request, so avoid repeatedly running manual scenarios on the free tier.

## Reports and artifacts

Local and CI runs provide:

- k6 console summary;
- JSON summary files through `--summary-export`;
- GitHub Actions artifact upload for CI summaries.

Generated report files are ignored by Git so the repository stays clean:

- `results/*.json`
- `results/*.html`

## Troubleshooting

### `429 rate_limit_exceeded`

ReqRes free-tier API keys have a daily request limit. If the limit is exhausted, k6 checks fail because endpoints return `429` instead of expected `200`, `201`, or `404` responses.

What to do:

- wait until the reset time reported by ReqRes;
- avoid repeatedly running manual `load`, `stress`, and `spike` scenarios;
- use the static validation CI job when you only need to validate code and k6 scenario configuration.

### `401` or `403`

ReqRes rejected the API key.

Check that:

- `REQRES_API_KEY` is set locally;
- the GitHub Actions secret is named exactly `REQRES_API_KEY`;
- requests include the `x-api-key` header.

### Missing `REQRES_API_KEY`

The HTTP client intentionally throws a clear error if the API key is missing. This prevents accidental unauthenticated traffic and makes local or CI setup issues visible immediately.

### Load scenario fails but smoke passes

ReqRes is a shared public API, so load-style scenarios can be affected by quota, rate limiting, WAF behavior, or temporary service-side controls. The non-smoke scenarios are intentionally read-heavy and request-budgeted, but they should still be run sparingly on the free tier.

## Limitations

ReqRes is an external public service. Results can be affected by network latency, daily free-tier limits, rate limits, WAF behavior, service availability, or shared infrastructure constraints. If repeated write-like or auth-like requests are executed under load, or if the daily request quota is exhausted, ReqRes may reject responses even when the test code is correct.

This repository intentionally avoids aggressive load levels. The scenarios are designed to demonstrate k6 architecture, validation, quality gates, and CI integration, not to benchmark ReqRes or generate high traffic against a shared API.

## GitHub repository setup

Suggested repository description:

```text
Portfolio API performance testing project for ReqRes using Grafana k6, thresholds, checks, GitHub Actions, and safe API key handling.
```

Suggested repository topics:

```text
k6, performance-testing, load-testing, api-testing, qa-automation, github-actions, reqres
```

## Future improvements

- Add Grafana Cloud k6 integration.
- Add HTML report generation.
- Add custom metrics per endpoint.
- Expand endpoint-specific thresholds for all flows.
- Add test data parametrization.
- Add GitHub Pages for publishing test reports.
- Add comparison between baseline and latest run.
