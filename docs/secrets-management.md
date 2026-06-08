# Secrets Management

## Purpose

This project requires a ReqRes API key for every request. The key must be provided through environment variables or GitHub Secrets and must never be committed to the repository.

The expected secret name is:

```text
REQRES_API_KEY
```

## Local Development

Recommended local setup:

```powershell
Copy-Item .env.example .env
```

Then set the real value in `.env`:

```text
REQRES_API_KEY=your-api-key
ENVIRONMENT=prod
```

The `.env` file is ignored by Git.

For one-off PowerShell runs:

```powershell
$env:REQRES_API_KEY="your-api-key"
k6 run scenarios/smoke.js
```

For one-off Bash runs:

```bash
export REQRES_API_KEY="your-api-key"
k6 run scenarios/smoke.js
```

## CI Configuration

GitHub Actions reads the key from a repository secret:

```text
REQRES_API_KEY
```

The workflow passes it to k6 as an environment variable. The test code reads it through `__ENV.REQRES_API_KEY` and sends it as the `x-api-key` header.

## Repository Rules

Do not commit:

- real `.env` files;
- API keys in README examples;
- API keys in test payloads;
- GitHub Actions logs that expose secret values;
- exported reports if they contain sensitive data.

Do commit:

- `.env.example`;
- documentation that uses placeholder values;
- workflow references to `${{ secrets.REQRES_API_KEY }}`;
- code that fails clearly when the key is missing.

## Failure Modes

| Symptom | Likely cause | Action |
|---|---|---|
| `REQRES_API_KEY environment variable is required` | Local variable or CI secret is missing | Set `REQRES_API_KEY` |
| HTTP `401` | Missing or invalid API key | Check local env var or GitHub secret |
| HTTP `403` | Key rejected or environment access issue | Check key value and ReqRes dashboard |
| HTTP `429` | Daily quota exhausted | Wait for reset and avoid repeated manual runs |

## Rotation Guidance

Rotate the ReqRes key when:

- it was accidentally committed;
- it was pasted in a public issue, PR, or chat;
- a local machine or CI environment is no longer trusted;
- ReqRes dashboard indicates key issues.

After rotation:

1. Update local `.env`.
2. Update the GitHub repository secret.
3. Run `smoke` once when quota is available.
4. Do not rerun load-style scenarios just to validate the new key.

## Review Checklist

For every PR:

- verify no secret values were added to the diff;
- verify `.env` remains ignored;
- verify the workflow still uses `secrets.REQRES_API_KEY`;
- verify docs use placeholders only;
- verify failure messages do not print the key.
