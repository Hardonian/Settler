# Launch Event Taxonomy

This document defines launch-readiness instrumentation events used in the web app.

## Principles

- Typed event names in code.
- No-op safe behavior when analytics providers are not configured.
- Minimal payloads, no secrets, no raw PII.

## Event list

### Acquisition / Interest

- `hero_cta_clicked`
- `docs_cta_clicked`
- `github_outbound_clicked`
- `demo_cta_clicked`
- `contact_cta_clicked`

### Activation

- `onboarding_started`
- `onboarding_completed`
- `first_meaningful_action_completed`

### Engagement

- `docs_section_opened`

### Conversion intent

- `pricing_or_enterprise_intent`

## Payload schema

```ts
type LaunchEventPayload = {
  location: "home" | "docs" | "footer" | "nav" | "use_case";
  ctaLabel: string;
  destination?: string;
  section?: string;
};
```

## Where events are emitted

- `packages/web/src/app/page.tsx` (home + nav + footer CTAs)
- `packages/web/src/app/docs/page.tsx` (docs navigation CTAs)
- `packages/web/src/app/use-cases/[slug]/page.tsx` (use-case activation + docs CTAs)

## Extending

1. Add event name to `LaunchEventName` in `packages/web/src/lib/analytics/launch-events.ts`.
2. Add instrumentation via `TrackedLink` or `trackLaunchEvent(...)`.
3. Update this taxonomy doc and map event to KPI.
