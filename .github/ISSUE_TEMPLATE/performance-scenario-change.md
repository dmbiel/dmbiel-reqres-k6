---
name: Performance scenario change
about: Propose or review a k6 scenario, threshold, metric, or traffic model change
title: "[Performance] "
labels: performance, qa
assignees: ""
---

## Change Type

- [ ] New scenario
- [ ] Existing scenario update
- [ ] Threshold update
- [ ] Metric or tag update
- [ ] CI/reporting update
- [ ] Documentation-only clarification

## Purpose

Describe the performance testing goal this change supports.

## Affected Scenarios

- [ ] Smoke
- [ ] Load
- [ ] Stress
- [ ] Spike

## Affected Endpoints

List endpoints and expected status codes.

| Endpoint | Method | Expected status | Scenario usage |
|---|---|---:|---|
|  |  |  |  |

## Request Budget Impact

Estimate whether this increases ReqRes traffic.

- Current approximate requests:
- New approximate requests:
- Reason this is acceptable for a public shared API:

## Quality Gates

Describe threshold changes and why they match the scenario intent.

- `http_req_failed`:
- `http_req_duration`:
- `checks`:
- endpoint-specific thresholds:

## Secret and Quota Safety

- [ ] Does not hardcode `REQRES_API_KEY`
- [ ] Does not print secrets in logs
- [ ] Keeps load-style traffic conservative
- [ ] Avoids repeated write-like or auth-like requests unless justified
- [ ] Can be validated with `k6 inspect` before a live run

## Validation Plan

- [ ] `node --check` for changed JavaScript files
- [ ] `k6 inspect` for changed scenarios
- [ ] Smoke run only if API-impacting behavior changed and quota is available
- [ ] Load/stress/spike run only when required by the change

## Notes

Add links to CI runs, artifacts, screenshots, or related discussions.
