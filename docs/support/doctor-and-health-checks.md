# Doctor and Health Checks

## `settler doctor`

`settler doctor` prints a runtime summary including:

- CLI/runtime version context
- node/os/shell/cwd metadata
- whether `SETTLER_API_KEY` is present
- active base URL value

Use it for local setup validation and bug report context.

## Health endpoints

- `/health`: global status
- `/health/live`: process liveness
- `/health/ready`: dependency readiness
- `/metrics`: telemetry endpoint

## Recommended verification flow

```bash
settler doctor
curl -sS http://localhost:3001/health
curl -sS http://localhost:3001/health/ready
curl -sS http://localhost:3001/metrics | head
```
