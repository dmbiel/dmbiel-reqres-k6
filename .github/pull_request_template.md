## Summary

<!-- Describe what changed and why. -->

## Validation

- [ ] JavaScript syntax checked with `node --check`
- [ ] k6 scenario options checked with `k6 inspect`
- [ ] Smoke test run when API-impacting code changed
- [ ] Manual load/stress/spike run considered only when needed

## ReqRes quota and secrets

- [ ] No secrets or real `.env` values committed
- [ ] Change does not introduce unnecessary ReqRes traffic
- [ ] Scenario request budget reviewed if k6 traffic changed
- [ ] Threshold configuration reviewed if quality gates changed
- [ ] Baseline update reviewed if `baselines/*.baseline.json` changed
- [ ] Documentation-only change does not require k6 execution
