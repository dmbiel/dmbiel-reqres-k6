# Contributing

## Purpose

This project is a portfolio-quality API performance testing suite for ReqRes. Contributions should preserve the main goal: demonstrate clean k6 architecture, checks, thresholds, reporting, CI quality gates, and safe public API usage.

## Before Changing Test Code

Before changing scenarios, helpers, or test flows:

- understand which ReqRes endpoints are affected;
- estimate the request budget impact;
- update `config/thresholds.js` when quality gates change;
- decide whether the change needs a live k6 run;
- prefer no-network validation first;
- keep secrets out of commits and logs.

## Local Setup

Install k6 and configure the API key locally:

```powershell
Copy-Item .env.example .env
```

Then set:

```text
REQRES_API_KEY=your-api-key
ENVIRONMENT=prod
```

The real `.env` file must stay local and is ignored by Git.

## No-Network Validation

Use these checks when you want to validate code without consuming ReqRes quota:

```powershell
Get-ChildItem -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch "\\node_modules\\" } |
  ForEach-Object { node --check $_.FullName }

k6 inspect scenarios/smoke.js
k6 inspect scenarios/load.js
k6 inspect scenarios/stress.js
k6 inspect scenarios/spike.js

npm run validate:baseline-comparison
npm run validate:html-report
```

## Live Run Guidance

When quota is available, run scenarios in this order:

1. Smoke.
2. Load, only if load behavior changed.
3. Stress or spike, only if that scenario changed.

Do not repeatedly run load-style scenarios just to check formatting, docs, or static code changes.

## Branch Naming

Use short, descriptive branch names:

```text
feat/performance-strategy-and-reporting
docs/quality-gates
ci/k6-reporting
```

Avoid branch names that describe tooling instead of the project change.

## Commit Style

Use clear conventional commit-style messages:

```text
docs: add metrics catalog
docs: document scenario design
docs: document secrets management
chore: add performance scenario issue template
docs: add contribution guide
feat: add baseline comparison reporting
```

## Pull Request Checklist

Before opening or updating a PR:

- [ ] no secrets or real `.env` values are committed;
- [ ] request budget impact is understood;
- [ ] `node --check` passed for changed JavaScript files;
- [ ] `k6 inspect` passed for changed scenarios;
- [ ] live k6 run was skipped when the change is docs-only;
- [ ] README or docs were updated when strategy, thresholds, metrics, or CI behavior changed.
- [ ] baseline files were updated only from reviewed, healthy k6 runs.
