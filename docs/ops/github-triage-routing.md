# GitHub Triage Routing (Operator + Support)

This runbook defines **automation-friendly issue intake** for runtime incidents, telemetry regressions, support requests, and operator/control-plane bugs.

## Issue templates

Use the structured issue forms under `.github/ISSUE_TEMPLATE/`:

- `runtime_error_incident.yml`
- `support_issue.yml`
- `telemetry_regression.yml`
- `operator_control_plane_bug.yml`

Each form captures dedupe/correlation fields:

- `tenant_id`
- `run_id` (when available)
- `route` / `module`
- `severity`
- `retryable`
- `error_signature`
- concise reproduction + stack summary

## Label taxonomy

Core labels:

- `triage` (all new structured issues)
- `incident` (runtime failures/degradation)
- `support` (customer/operator support request)
- `telemetry` (missing/broken observability)
- `operator` (control-plane behavior bugs)
- `bug` (defect rather than docs/question)

## Routing expectations

- `incident` + `runtime` => operator on-call + runtime owners
- `support` => support responder + module owner
- `telemetry` => observability owner + affected module owner
- `operator` => control-plane owner

## Dedupe guidance

Use this grouping key whenever possible:

`{error_signature}|{tenant_id}|{route}|{module}`

If `tenant_id` is unknown, dedupe by `error_signature|route|module` and include uncertainty in notes.

## OSS/private boundary

This repo only defines open intake standards. Future private automation (GitHub Apps, Slack routing, incident tooling) should attach through provider boundaries; do not hard-depend on private services here.
