# Settler — Launch KPI Framework

## Purpose

Define and track the metrics that indicate whether Settler's launch is working — attracting the right users, activating them successfully, and building toward product-market fit.

---

## A. Acquisition / Interest

| Metric                 | Definition                                                    | Surface                                | Event Name              |
| ---------------------- | ------------------------------------------------------------- | -------------------------------------- | ----------------------- |
| Homepage CTA clicks    | Clicks on "See How It Works," "Read Docs," "Book a Demo"      | Homepage                               | `cta_click`             |
| Docs CTA clicks        | Clicks on quickstart, API reference, or getting started links | Docs pages                             | `docs_cta_click`        |
| GitHub outbound clicks | Clicks on GitHub repo links from the site                     | Any page with GitHub links             | `github_outbound_click` |
| Contact/demo requests  | Submissions of demo or contact forms                          | /contact                               | `demo_request_submit`   |
| Page views by section  | Views of key landing pages                                    | Homepage, /docs, /pricing, /enterprise | `page_view`             |

## B. Activation

| Metric                   | Definition                                      | Surface               | Event Name                 |
| ------------------------ | ----------------------------------------------- | --------------------- | -------------------------- |
| Local setup start        | User begins install process (visits quickstart) | /docs/quickstart      | `setup_start`              |
| First demo run           | User runs the demo successfully                 | CLI / docs            | `demo_run_complete`        |
| First reconciliation run | User completes their first real reconciliation  | Console / API         | `first_reconciliation_run` |
| Evidence viewed          | User views or downloads an evidence bundle      | Console evidence page | `evidence_viewed`          |
| Replay executed          | User replays a previous run                     | Console / CLI         | `replay_executed`          |

## C. Engagement

| Metric                   | Definition                                                   | Surface    | Event Name                               |
| ------------------------ | ------------------------------------------------------------ | ---------- | ---------------------------------------- |
| Return sessions          | Users who return after initial visit                         | All pages  | `session_start` (with `returning: true`) |
| Feature usage by area    | Which product areas are used (runs, evidence, rules, review) | Console    | `feature_used`                           |
| Docs depth               | How far users navigate into documentation                    | Docs pages | `docs_page_view`                         |
| Console session duration | Time spent in the product console                            | Console    | `session_duration`                       |
| Issue submissions        | GitHub issues opened                                         | GitHub     | External metric                          |

## D. Conversion Intent

| Metric                | Definition                              | Surface     | Event Name                      |
| --------------------- | --------------------------------------- | ----------- | ------------------------------- |
| Pricing page views    | Views of the pricing page               | /pricing    | `page_view` (path: /pricing)    |
| Enterprise page views | Views of enterprise-specific content    | /enterprise | `page_view` (path: /enterprise) |
| Contact form opens    | User opens or navigates to contact form | /contact    | `contact_form_open`             |
| Demo booking clicks   | Clicks on "Book a Demo" CTA             | Any page    | `cta_click` (cta: book_demo)    |

## E. OSS / Community Health

| Metric              | Definition                        | Source         |
| ------------------- | --------------------------------- | -------------- |
| GitHub stars        | Repository star count             | GitHub API     |
| GitHub forks        | Repository fork count             | GitHub API     |
| Issue response time | Time to first maintainer response | GitHub         |
| PR merge time       | Time from PR open to merge        | GitHub         |
| Contributor count   | Unique contributors per month     | GitHub         |
| Docs feedback       | Docs helpfulness signals          | Site analytics |

---

## Implementation Notes

- All web analytics events are routed through `packages/web/src/lib/analytics/index.ts`
- Events respect cookie consent via `consent-gate.ts`
- Analytics is environment-aware: no-op in development, configurable provider in production
- No PII is collected in event payloads
- Event names use snake_case for consistency
- All events include automatic context: `page_path`, `timestamp`, `session_id`

## Privacy Requirements

- No user email, name, or identifying information in event payloads
- IP addresses not stored (use analytics provider anonymization)
- Cookie consent required before non-essential tracking
- Analytics fully functional when disabled (graceful no-op)
- No third-party tracking pixels
