# Scenario Design

## Purpose

This document explains why the project uses separate smoke, load, stress, and spike scenarios, and how those scenarios are kept safe for a shared public API.

ReqRes is not owned by this project. The suite is designed to demonstrate performance testing architecture and quality gates, not to discover ReqRes capacity limits.

## Scenario Principles

- Keep automatic PR validation lightweight.
- Use smoke as the primary CI gate.
- Keep repeated load-style traffic read-heavy.
- Avoid repeated write-like and auth-like requests under load.
- Use small request budgets to reduce quota and WAF risk.
- Prefer predictable pass/fail thresholds over large traffic volume.

## Scenario Matrix

| Scenario | Main intent | Endpoint mix | Traffic model | When to run |
|---|---|---|---|---|
| Smoke | Validate API availability and key flows | All covered flows | 1 VU, 1 iteration | Every ready PR and first local check |
| Load | Validate average read behavior | List users, single user | Conservative arrival rate | After scenario or threshold changes |
| Stress | Observe behavior above normal read traffic | List users, single user | Higher arrival rate with small cap | Manual run when quota is available |
| Spike | Observe short read traffic increase | List users only | Short arrival-rate burst | Manual run when spike logic changes |

## Why Smoke Covers All Flows

Smoke is the safest place to validate the complete API flow list because it sends only one request per flow.

It covers:

- list users;
- single user;
- user not found;
- create user;
- login successful;
- delayed response.

This confirms headers, API key handling, status expectations, JSON fields, negative status handling, and delayed endpoint behavior without producing repeated traffic.

## Why Load-Style Scenarios Are Read-Heavy

The load, stress, and spike scenarios intentionally avoid repeated `POST /api/users` and `POST /api/login` calls.

This keeps the suite aligned with public API testing etiquette:

- repeated write-like traffic is unnecessary for this portfolio goal;
- repeated auth-like traffic can look suspicious to public API controls;
- read-heavy traffic is enough to demonstrate k6 executors, thresholds, checks, tagging, and reporting.

## Executor Choice

Load-style scenarios use `ramping-arrival-rate` instead of simple looping VUs.

This gives a clearer request budget because the test controls how many iterations start over time. It is easier to explain and safer for a public API than "as many iterations as possible" loops.

## Request Budget Guidance

Approximate request budgets are kept intentionally small:

| Scenario | Approx. requests | Reason |
|---|---:|---|
| Smoke | 6 | One request per covered flow |
| Load | ~25 | Enough to show stable read behavior |
| Stress | ~30 | Slightly higher read profile without aggressive volume |
| Spike | ~10 | Short burst demonstration only |

These numbers are not meant to produce statistically rigorous benchmarking. They are meant to demonstrate controlled test design.

## Threshold Philosophy

Thresholds are set to show automated gating while staying realistic for an external service.

| Scenario | Threshold posture |
|---|---|
| Smoke | Strict functional correctness and endpoint-specific timing |
| Load | Moderate latency and low error tolerance |
| Stress | More tolerant because traffic is intentionally above normal |
| Spike | More tolerant because the run is short and bursty |

Thresholds should only be relaxed when there is a clear strategy reason, not just to make a failing run pass.

## Review Checklist For Scenario Changes

Before changing a scenario:

- confirm which endpoint flows are affected;
- estimate the request budget;
- confirm whether the change consumes more ReqRes quota;
- update thresholds when scenario intent changes;
- update docs if the scenario model changes;
- prefer `k6 inspect` for no-network validation before live runs.
