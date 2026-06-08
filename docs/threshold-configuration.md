# Threshold Configuration

## Purpose

k6 thresholds are the executable quality gates for this project. They decide whether a run passes or fails in CI.

Thresholds are centralized in:

```text
config/thresholds.js
```

Scenario files import named threshold presets instead of defining long inline threshold blocks.

## Presets

| Preset | Used by | Policy intent |
|---|---|---|
| `smokeThresholds` | `scenarios/smoke.js` | Strict API availability and full-flow correctness |
| `loadThresholds` | `scenarios/load.js` | Conservative read-heavy average-load behavior |
| `stressThresholds` | `scenarios/stress.js` | More tolerant higher-than-normal read traffic |
| `spikeThresholds` | `scenarios/spike.js` | More tolerant short burst behavior |

## Why Thresholds Are Centralized

Centralizing thresholds makes review easier:

- scenario files stay focused on execution model and endpoint mix;
- quality gate changes are visible in one file;
- threshold policy can be reviewed separately from traffic model changes;
- scenario-specific intent remains explicit through named presets.

## Change Guidance

Do not loosen thresholds only to make CI pass.

Change thresholds when:

- scenario intent changes;
- endpoint coverage changes;
- baseline evidence shows a stable new expectation;
- public API constraints require a documented adjustment;
- a new endpoint-specific metric is added.

When changing thresholds:

1. Update `config/thresholds.js`.
2. Update [Quality Gates](quality-gates.md) if policy changes.
3. Run no-network validation:

   ```powershell
   Get-ChildItem -Recurse -Filter *.js |
     Where-Object { $_.FullName -notmatch "\\node_modules\\" } |
     ForEach-Object { node --check $_.FullName }

   k6 inspect scenarios/smoke.js
   k6 inspect scenarios/load.js
   k6 inspect scenarios/stress.js
   k6 inspect scenarios/spike.js
   ```

4. Run live `smoke` only when API-impacting behavior changed and quota is available.

## Current Policy Summary

| Scenario | Error rate | Duration | Checks |
|---|---:|---|---:|
| Smoke | `< 1%` | standard/negative p95 `< 1000 ms`, delayed p95 `< 5000 ms` | `> 95%` |
| Load | `< 2%` | p95 `< 1200 ms`, p99 `< 2000 ms` | `> 95%` |
| Stress | `< 5%` | p95 `< 2000 ms`, p99 `< 3000 ms` | `> 90%` |
| Spike | `< 5%` | p95 `< 2000 ms` | `> 90%` |

Endpoint-specific thresholds are defined only for endpoints executed by each scenario.
