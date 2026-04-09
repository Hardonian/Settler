# Settler — Event Taxonomy

## Event Naming Convention

All events use `snake_case`. Events are grouped by category prefix.

## Core Events

### Navigation & Page Views

| Event           | Properties                  | Description          |
| --------------- | --------------------------- | -------------------- |
| `page_view`     | `path`, `title`, `referrer` | Page load            |
| `session_start` | `returning: boolean`        | New browsing session |

### CTA Interactions

| Event                   | Properties                                               | Description                        |
| ----------------------- | -------------------------------------------------------- | ---------------------------------- |
| `cta_click`             | `cta: string`, `location: string`, `destination: string` | Click on any call-to-action button |
| `docs_cta_click`        | `doc_section: string`, `destination: string`             | Click on documentation CTA         |
| `github_outbound_click` | `location: string`                                       | Click on link to GitHub            |

### Product Usage

| Event                          | Properties                                                             | Description                           |
| ------------------------------ | ---------------------------------------------------------------------- | ------------------------------------- |
| `feature_used`                 | `feature: string`, `area: string`                                      | User interacts with a product feature |
| `reconciliation_run_started`   | `source_count: number`                                                 | User initiates a reconciliation run   |
| `reconciliation_run_completed` | `match_count: number`, `mismatch_count: number`, `duration_ms: number` | Run completes                         |
| `evidence_viewed`              | `run_id: string`, `format: string`                                     | User views evidence bundle            |
| `evidence_exported`            | `run_id: string`, `format: string`                                     | User exports evidence                 |
| `replay_executed`              | `original_run_id: string`                                              | User replays a previous run           |
| `mismatch_reviewed`            | `mismatch_id: string`, `resolution: string`                            | User reviews a mismatch               |
| `rule_created`                 | `rule_type: string`                                                    | User creates a matching rule          |
| `connection_added`             | `adapter_type: string`                                                 | User adds a data source connection    |

### Onboarding

| Event                  | Properties                            | Description                       |
| ---------------------- | ------------------------------------- | --------------------------------- |
| `setup_start`          | `method: string`                      | User begins setup process         |
| `setup_step_completed` | `step: string`, `step_number: number` | User completes an onboarding step |
| `setup_completed`      | `duration_ms: number`                 | User completes full setup         |
| `demo_run_complete`    | —                                     | User successfully runs the demo   |

### Forms & Contact

| Event                 | Properties             | Description               |
| --------------------- | ---------------------- | ------------------------- |
| `contact_form_open`   | `source: string`       | User opens contact form   |
| `demo_request_submit` | `company_size: string` | User submits demo request |

### Errors

| Event                | Properties                                   | Description                    |
| -------------------- | -------------------------------------------- | ------------------------------ |
| `error_boundary_hit` | `component: string`, `error_message: string` | React error boundary triggered |
| `api_error`          | `endpoint: string`, `status_code: number`    | API request failed             |

## Event Property Standards

- All events automatically include: `timestamp`, `page_path`, `session_id`
- No PII in any event property
- `run_id` and `mismatch_id` are opaque identifiers, not user data
- Numeric values use specific units in the property name (e.g., `duration_ms`)
- Boolean properties use `is_` or adjective prefix (e.g., `returning`)

## Provider Mapping

Events are dispatched through the analytics abstraction layer (`lib/analytics/index.ts`) and forwarded to configured providers. Supported providers:

- **Vercel Analytics** — web vitals and page views
- **PostHog** — product analytics and feature usage
- **GA4** — acquisition and conversion tracking
- **Custom** — webhook-based forwarding for self-hosted setups

## Environment Behavior

| Environment            | Behavior                                    |
| ---------------------- | ------------------------------------------- |
| Development            | Events logged to console (debug mode)       |
| Preview/Staging        | Events sent to staging provider instance    |
| Production             | Events sent to production provider instance |
| No provider configured | Graceful no-op, no errors                   |
