# CI and ReqRes Limits

## Purpose

This project uses GitHub Actions to demonstrate how k6 tests can act as CI quality gates while still respecting the limits of a shared public API.

ReqRes is not owned by this project. The goal is to validate test architecture, checks, thresholds, reporting, and CI behavior without generating aggressive traffic.

## Workflow Overview

The workflow is defined in `.github/workflows/k6.yml`.

It has two jobs:

1. `Static validation`

   Runs without calling ReqRes:

   - validates JavaScript syntax with `node --check`;
   - validates k6 scenario configuration with `k6 inspect`;
   - catches syntax/configuration issues without consuming API quota.

2. `Run k6 tests`

   Calls ReqRes and consumes request quota:

   - validates that `REQRES_API_KEY` is configured;
   - runs a preflight ReqRes request;
   - fails early on `429`, `401`, or `403`;
   - runs the selected k6 scenario;
   - exports the k6 JSON summary as a GitHub Actions artifact.

## Trigger Strategy

The workflow runs automatically for pull requests targeting `main`.

It does not run automatically after the PR is merged into `main`. This avoids spending ReqRes quota twice for the same change:

- once on the pull request;
- once again on the merge commit.

Draft pull requests run static validation only. The quota-consuming k6 job starts when the pull request is marked ready for review.

Documentation-only changes are ignored by the workflow:

- `README.md`
- `.env.example`
- `LICENSE`

Manual runs are still available through `workflow_dispatch`.

## Scenario Request Budgets

The non-smoke scenarios use conservative request budgets because ReqRes is a public shared API.

| Scenario | Traffic model | Approx. requests |
|---|---|---:|
| Smoke | 1 VU, 1 iteration | 6 |
| Load | Ramping arrival rate, max 3 VUs | ~25 |
| Stress | Ramping arrival rate, max 5 VUs | ~30 |
| Spike | Ramping arrival rate, max 4 VUs | ~10 |

These numbers are intentionally small. They are enough to demonstrate scenario modeling and thresholds without treating ReqRes as benchmark infrastructure.

## Handling `429 rate_limit_exceeded`

If ReqRes returns `429`, the daily free-tier quota is exhausted.

Expected behavior:

- the preflight step fails early;
- the error message includes the reset time when ReqRes provides it;
- k6 does not continue into a larger scenario run.

Recommended response:

- wait until the daily reset time;
- avoid rerunning manual load-style scenarios repeatedly;
- use the static validation job for no-network checks.

## Local Validation Without API Traffic

Use these checks when you want confidence without consuming ReqRes quota:

```powershell
Get-ChildItem -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch "\\node_modules\\" } |
  ForEach-Object { node --check $_.FullName }

k6 inspect scenarios/smoke.js
k6 inspect scenarios/load.js
k6 inspect scenarios/stress.js
k6 inspect scenarios/spike.js
```

## Manual Run Guidance

Recommended order when the daily quota is available:

1. Run `smoke` first.
2. Run one load-style scenario only if needed.
3. Avoid repeating `load`, `stress`, and `spike` unless the scenario code changed.

This keeps CI useful while making the quota behavior explicit and controlled.
