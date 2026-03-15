# UI Credibility Audit — Settler
**Audit date:** 2026-03-14
**Auditor mindset:** Senior staff engineer / skeptical open-source evaluator / Stripe-level product designer / investor diligence
**Branch audited:** `claude/ui-credibility-audit-greOi` (post–frontend-polish-pass)

---

## PHASE 1 — First Impression Test

**Verdict: Structurally intentional, operationally hollow.**

Opening the app cold produces a dashboard that is a clean, well-organized link list — and nothing else. There are no live metrics, no system state, no signals that anything is actually running. For an infrastructure product that sells "deterministic reconciliation," the first screen communicates nothing about the system's current state. A skeptical engineer opens this and thinks: *"This is a navigation page, not a control plane."*

**Specific issues:**

- **Main dashboard (`/app/page.tsx`) is a static link directory.** It contains zero dynamic data. Every other serious infrastructure product (Datadog, Linear, PlanetScale) shows at least a health pulse or recent activity on load. This shows none.
- **Arrow characters as CTAs.** `"Open Evidence Query Surface →"` uses a raw Unicode `→` as a call-to-action indicator. It looks like a markdown render artifact, not intentional UI design.
- **The heading "Differentiated operator workflows" is marketing copy inside an operator tool.** Operators who log in daily don't need to be told their workflows are differentiated. This belongs on the landing page.
- **"Tenant: default"** in the header (line 105, `app/layout.tsx`) — if `user.user_metadata?.tenant_id` is not set, the header reads literally `Tenant: default`. Every new user sees this until their metadata is configured. It signals a partially initialized system.
- **The environment badge exposes `process.env.NODE_ENV` raw** (line 109, `app/layout.tsx`). Showing `"development"` or `"production"` directly is fine internally, but the styling (muted, monospace badge) suggests it hasn't been thought through for production display. A production-grade env badge would show the environment name, deployment version, or nothing.

---

## PHASE 2 — Visual Maturity Audit

**Verdict: Three different design systems are in the same codebase. One is clearly the "real" one. The others are imported ghosts.**

The app layout and most core pages use clean, consistent Tailwind: `bg-white`, `border-slate-200`, `text-slate-900`. But the `stitch-import/` component family uses a completely different token vocabulary and visual register. The result is jarring visual discontinuity across pages that share the same sidebar.

**Token system fragmentation — four competing naming conventions found in production pages:**

| Location | Token style used |
|---|---|
| `app/page.tsx` (main dashboard) | `bg-white border-slate-200 text-blue-600` (raw Tailwind) |
| `app/layout.tsx` (sidebar) | `bg-background-light dark:bg-background border-border` (custom semantic) |
| `alerts/page.tsx` | `bg-background-light dark:bg-background-dark text-neutral-dark` (different custom) |
| `stitch-import/ControlPlaneOverview.tsx` | `bg-surface-card border-border-subtle shadow-card` (third custom vocabulary) |
| `stitch-import/PolicyViewer.tsx` | `bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark text-text-main-light` (fourth) |

A staff engineer reading this code cannot determine which token set is authoritative. The design system exists (`/design-system/css-tokens.css`) but pages don't use it uniformly.

**Other visual maturity failures:**

- **`font-display` class on `alerts/page.tsx` (line 19)** is not a standard Tailwind utility. If it's not defined in the Tailwind config, it silently renders nothing. If it is defined, it's an undocumented custom class. Either way it signals inconsistency.
- **No active/selected state on navigation links.** The sidebar has no visual indicator of the current route. Every item looks identical whether you're on it or not. This is a fundamental navigation maturity requirement.
- **`SecurityOverview` renders inside a `max-w-md mx-auto` wrapper** — a mobile app frame — inside a desktop layout. The component is visually constrained to ~448px wide, centered in a panel that is 100% of the main content area. It looks like a phone screen dropped into a desktop dashboard.
- **Inconsistent border-radius usage.** Pages mix `rounded-xl`, `rounded-2xl`, `rounded-lg`, `rounded-[var(--sidebar-item-radius)]` without apparent system. The sidebar uses a CSS variable radius for nav items but inline `rounded-xl` for cards on the same page.
- **Padding rhythm is not shared.** Main dashboard cards use `p-5`/`p-6`. Alert cards use `p-4 pl-5`. Integration cards use `p-5`. ControlPlaneOverview cards use `p-4`. None of these reference the `--ui-card-padding` token defined in the design system.

---

## PHASE 3 — Dashboard Credibility Test

**Verdict: The most visible dashboards are entirely fake. This is the single largest credibility problem in the product.**

The System Telemetry page (`/app/system-health`) and the Live Alerts page (`/app/alerts`) are the two surfaces most likely to be opened by an evaluating engineer or investor. Both are 100% hardcoded static JSX with no API calls, no state management, and no indication they are demo content.

### System Telemetry — `ControlPlaneOverview.tsx`

Every number is fake:

```
"99.98% Uptime (24h)"            — hardcoded
"452 Backlog Queue"               — hardcoded
"12 Spikes Detected in last 60m" — hardcoded
"CRITICAL ALERT: Webhook latency > 500ms in EU-West" — hardcoded, always visible
Run #8821 / $1.2M / trc_8a9...b2  — hardcoded
Run #8820 / $850K / trc_2c4...e1  — hardcoded
Run #8819 / $3.4M / trc_x91...p0  — hardcoded
```

The component renders a `RefreshCw` spinner labeled **"Live Updates"** (line 56-59). Nothing is live. The spinner is decorative. A CRITICAL ALERT for "Webhook latency > 500ms" is permanently displayed — it cannot be dismissed in any meaningful way because there is no state.

### Live Alerts — `alerts/page.tsx`

```
2 Critical / 5 Warning / 12 Info — hardcoded counts
"Payment Gateway Timeout - 500 Error" — hardcoded title
"Jane Doe" acknowledged by — hardcoded user
"TRC-9928-X" runbook ID — hardcoded
"SOP-Ledger-04" — hardcoded
"2m ago", "15m ago", "1h ago", "3h ago" — hardcoded timestamps
Filter tabs: Open (14) / Ack (4) / Resolved — not interactive
```

The filter tabs (line 73-84) are styled as a segmented control but are plain `<button>` elements with no click handlers, no state, no routing. Clicking them does nothing.

The action buttons — `Ack`, `Escalate`, `Resolve`, `BellOff` — are all non-functional. There is no feedback, no state change, no API call.

### What real data exists:

- **Run Explorer** (`runs/page.tsx`) — real API call, but renders raw `row.created_at` without formatting and types rows as `any`.
- **Runtime Event Signals** (`metrics/page.tsx`) — real API call, but honestly discloses it shows only "partial runtime event visibility" (slow routes, 7d window).
- **Capability Status** (`capability-status/page.tsx`) — real API calls with no auth headers, reads from a local JSON file.

The gap between these real-but-minimal surfaces and the fake-but-polished stitch-import surfaces is the most damaging credibility problem in the product.

---

## PHASE 4 — UX Trust Leaks

### Fake data with no Demo Mode indicator

No page with hardcoded data contains any "Demo" or "Sample data" label. A first-time evaluator has no way to distinguish between live and mock surfaces.

### Buttons that do nothing

| Button | Location | Effect |
|---|---|---|
| `Ack` | alerts/page.tsx:123 | None |
| `Escalate` | alerts/page.tsx:189 | None |
| `Resolve` | alerts/page.tsx:191 | None |
| `BellOff` (silence) | alerts/page.tsx:121 | None |
| `Abort` | ControlPlaneOverview.tsx:196 | None |
| `Details` | ControlPlaneOverview.tsx:201 | None |
| `View Log` | ControlPlaneOverview.tsx:140 | None |
| Copy trace IDs | ControlPlaneOverview.tsx:188 | None |
| `ArrowLeft` back | SecurityOverview.tsx:23 | None — no href or handler |
| `Whitepaper` download | SecurityOverview.tsx:59 | None |
| `Filter` icon | PolicyViewer.tsx:14 | None |
| `+ Add Policy` | PolicyViewer.tsx:15 | None |

### "All cylinders firing: false" exposed to users

`capability-status/page.tsx` line 75:
```tsx
<p className="text-sm text-slate-600">All cylinders firing: {String(health?.allCylindersFiring ?? false)}</p>
```
This is an internal API field name rendered literally in the UI. An investor or customer sees "All cylinders firing: false." It reads as a system failure even when it's just a null/default value. This is a trust leak and a developer-speak exposure.

### Raw `created_at` in the Runs table

`runs/page.tsx` line 48 renders `{row.created_at}` without formatting. This shows ISO 8601 timestamps like `2024-09-12T14:33:01.129Z` directly in the table column. The column header says "Created" — a formatted date is expected.

### Hardcoded timestamps that are over a year stale

`IntegrationList.tsx` lines 104-118 show activity logs timestamped:
```
2023-10-24 14:32:01
2023-10-24 12:15:44
2023-10-23 09:10:12
```
These timestamps are from October 2023. In March 2026, they are 29 months old. Any evaluator who notices this immediately understands the component is not connected to anything real.

### "View Full Audit Log" links to `#`

`IntegrationList.tsx` line 122: `<a href="#">View Full Audit Log</a>` — a dead link presented as a functional navigation element.

### "Add Integration" button links to an undefined route

`integrations/page.tsx` line 15: `href="/app/connections"`. This route does not exist in the app navigation. Clicking "Add Integration" produces a 404 or a blank page.

### Compliance logos are grey rectangles

`SecurityOverview.tsx` lines 213-222:
```tsx
<div className="h-6 w-full bg-slate-300 dark:bg-slate-600 rounded"></div>
```
Three grey rectangles labeled "Standards we meet" stand in place of SOC 2, GDPR, HIPAA, and ISO 27001 logos. The code comment says `/* Using simple SVGs for logos representation */`. These are bare placeholder divs — not SVGs, not images, not even placeholder text.

### External Google user content URL hardcoded in SecurityOverview

`SecurityOverview.tsx` line 39 uses a `backgroundImage` pointing to `lh3.googleusercontent.com/aida-public/...`. This is an AI-generated image URL from Google's AIDA system. These URLs are not stable and will break. An audit surface for a security-critical reconciliation platform uses a random Google-hosted image as its hero visual.

### The Freeze System toggle has no confirmation dialog

`FreezeToggle.tsx` — toggling "Freeze System" to Read-Only Mode is a destructive operation that blocks all write access. There is no confirmation, no warning modal, no audit trail. A single misclick freezes the system.

---

## PHASE 5 — Navigation Coherence

### No active state on any navigation link

`app/layout.tsx` lines 88-95: every navigation link uses identical static classes regardless of current route. There is no `aria-current="page"`, no active background, no font weight change. You cannot tell where you are in the product by looking at the sidebar.

### Page titles do not match navigation labels

| Navigation label | Page `<h1>` |
|---|---|
| Policy Lab | Policies |
| Runtime Event Signals | Runtime Event Signals |
| System Telemetry | System Telemetry |
| Evidence Query Surface | Evidence Query Surface |
| Tenant Isolation Controls | Tenant Isolation Controls |

"Policy Lab" → page says "Policies." No other mismatch is as jarring, but the "Policy Lab" vs "Policies" inconsistency breaks the mental model. The nav promises a lab environment; the page delivers a viewer.

### "Add Integration" navigates outside the nav graph

The Integrations page has a primary action button that routes to `/app/connections` — a path that does not appear anywhere in the sidebar navigation. The user exits the nav graph with no path back other than the browser button.

### No breadcrumbs anywhere

Not a hard requirement, but for an app with deeply nested surfaces (runs → run detail → evidence), there is no breadcrumb system. Run Explorer links to individual run pages (`/app/runs/{id}`) but the detail pages are not visible in this audit and there is no navigation hierarchy established.

### Mobile: no navigation fallback

`app/layout.tsx` line 77: `<aside className="hidden md:flex ...">` — the sidebar is hidden on mobile with no hamburger menu, no sheet, no alternative navigation provided in the app shell layout. On a mobile browser or narrow viewport, the app has no navigation.

---

## PHASE 6 — Accessibility Reality Check

### Double header on Alerts page

`alerts/page.tsx` (line 21): the AlertsPage renders its own `<header>` with `sticky top-0 z-50` — inside an app layout that already has a `<header>` with `h-14`. The result is two stacked sticky headers. The inner header has `pt-12` to compensate, but the visual result is a layout anomaly that looks broken on first load.

### Filter tabs are buttons with no state

`alerts/page.tsx` lines 74-83: three `<button>` elements styled as a segmented control. The first has a white background to look "selected." None of them have `aria-selected`, `aria-pressed`, or any role indicating selection state. A screen reader user has no way to know which filter is active.

### Unlabeled icon buttons throughout

- `BellOff` button in alerts: no `aria-label` (line 120-122)
- `MoreVertical` buttons in IntegrationList (×3): no `aria-label`
- `Filter` and `PlusCircle` in PolicyViewer: `cursor-pointer` spans with no button role or label
- `ArrowLeft` in SecurityOverview: no label, no handler

### Freeze System toggle has no visible label on the control itself

`FreezeToggle.tsx` line 22-25: the toggle's visible label is "Freeze System" in a heading above it, but the `<label>` wrapping the `<input>` has no text — only `<span className="sr-only">Freeze System</span>`. The association is correct for screen readers, but a sighted user has to visually map the heading to the toggle, which are separated by a description paragraph.

### `ControlPlaneOverview` uses hardcoded `peer-checked:` classes that do not work

`ControlPlaneOverview.tsx` lines 43-44: the freeze toggle uses `peer-checked:translate-x-full` on a sibling div, but the sibling is not a `peer` of the input — the `peer` class is on the input, but the visually styled div is not a direct sibling in the DOM. The toggle will not animate on check. This is a broken interactive control.

---

## PHASE 7 — Product Trust Signals

### Timestamp consistency: none

| Surface | Format | Source |
|---|---|---|
| Alerts page | "2m ago", "15m ago", "1h ago" | Hardcoded relative strings |
| IntegrationList | "2023-10-24 14:32:01" | Hardcoded absolute ISO |
| Runs table | Raw ISO from API | Unformatted |
| Capability Status | Raw `timestamp` field from API | Unformatted |
| ControlPlaneOverview | "2m 14s", "0m 45s", "--:--" | Hardcoded |

There is no shared timestamp formatting utility applied consistently across the product.

### Status label vocabulary is not shared

Five different status systems are in use simultaneously:

- Alerts: `Critical` / `Warning` / `Info`
- Integrations: `Healthy` / `Degraded` / `Expired`
- Runs: whatever string the API returns (unformatted, no badge)
- ControlPlaneOverview: `Running` / `Retrying` / `Queued`
- Capability Status: `overallStatus` string from API (unformatted)

No shared `StatusBadge` component normalizes these. Each surface invents its own badge styling inline.

### The permanent CRITICAL ALERT is always visible

`ControlPlaneOverview.tsx` lines 61-80: a red CRITICAL ALERT box for "Webhook latency > 500ms in EU-West" is rendered unconditionally. There is no dismissal state, no condition check, no API call. Every user who opens System Telemetry sees a critical alert. This destroys the signal value of critical alerts.

### "ISO 27001 Certified" badge over a Google-hosted image

`SecurityOverview.tsx` line 44: an inline badge claims `ISO 27001 Certified` as a visual overlay on a hero image. This claim is not backed by any data source, link, or external verification in the component. It is decorative text that claims a certification.

### Silent API failures produce blank content, not error states

All pages that call real APIs use the pattern `if (!res.ok) return []`. Users see an empty table or no content with no explanation of whether the data is loading, failed, unauthorized, or genuinely empty. There is no visual distinction between "no runs exist" and "the API returned 500."

The empty state in the runs table (line 36-39) says: *"No runs yet. Start a reconciliation workflow to populate this list."* — this text appears identically whether the system has zero runs or whether the API call failed silently.

---

## PHASE 8 — Final Maturity Verdict

### Strongest aspects of the UI

**Core page structure is clean and restrained.** The main dashboard, Evidence Query Surface, and Metrics pages show disciplined information hierarchy: eyebrow text → h1 → description → content. No visual noise, no decorative overload.

**The component library foundation is solid.** Button variants, badge variants, card composition, and input components are well-structured with CVA, accessible markup, and thoughtful state management. The design token architecture is sophisticated and correct.

**Typography scale is intentional.** Fluid `clamp()` sizing, consistent heading hierarchy, and the eyebrow/label/heading three-level pattern are applied correctly on most pages.

**Error message sanitization exists.** `error-state.tsx` strips stack traces and technical identifiers before display — this shows security awareness.

**The navigation architecture is logically grouped.** "Execution Infrastructure / Operator Intelligence / Governance" is a coherent mental model for an operator tool.

---

### Remaining credibility leaks

**P0 — Product integrity:**

1. **`alerts/page.tsx` is 100% hardcoded fake data** presented as live operational state. No demo indicator. Buttons do nothing.
2. **`ControlPlaneOverview.tsx` (System Telemetry) is 100% hardcoded fake data** with a decorative "Live Updates" spinner. The permanent CRITICAL ALERT cannot be dismissed.
3. **`SecurityOverview.tsx` (Audit Surfaces) is a mobile app marketing screen** served in a desktop layout with grey rectangle placeholder compliance logos and an AI-generated Google-hosted hero image.
4. **`PolicyViewer.tsx` (Policy Lab) is 3 hardcoded policy rows** with no interactive functionality.
5. **`IntegrationList.tsx` has activity timestamps from October 2023** — 29 months stale.

**P1 — Design system:**

6. **No active nav state.** Cannot tell what page you're on from the sidebar.
7. **Four competing CSS token vocabularies** across pages in the same app shell.
8. **`SecurityOverview` renders as a mobile frame** inside a desktop layout.
9. **`font-display` class on alerts page** is not a standard Tailwind class.

**P2 — UX gaps:**

10. **"Add Integration" routes to `/app/connections`** — an undefined route.
11. **"Freeze System" has no confirmation dialog** for a destructive write-blocking action.
12. **`All cylinders firing: false`** rendered directly in the Capability Status UI.
13. **Raw ISO timestamps in the Runs table** instead of formatted dates.
14. **"View Full Audit Log" links to `#`** — a dead anchor.
15. **No mobile navigation fallback** in the app shell.

---

### Design maturity score

**5.5 / 10**

The foundation infrastructure (component library, design tokens, routing architecture, auth flow) scores a 7–8. The populated pages score a 3–4. The average is dragged to 5.5 by the scale of the fake data problem.

---

### Areas still feeling prototype-like

- All stitch-import components — they are design mockups embedded in a real application shell
- The main dashboard — a link list is not a control plane landing page
- Alert management — entirely non-functional
- System telemetry — entirely non-functional
- Policy Lab — read-only display of hardcoded rows
- Audit Surfaces — a mobile marketing screen with placeholder graphics
- Timestamp formatting — inconsistent across every surface
- Navigation active states — absent

### Areas that now feel production-grade

- The sidebar layout, auth flow, and env validation (`EnvErrorPanel`)
- The UI component library (`button.tsx`, `badge.tsx`, `card.tsx`, `input.tsx`, `empty-state.tsx`, `error-state.tsx`)
- The Evidence Query Surface page (clean, factual, correct information architecture)
- The Runtime Event Signals page (honest about its limitations, real data)
- The Capability Status page (real API calls, structured data from registry)
- Typography system and design token definitions

---

### Final verdict

> **"This still feels like a startup prototype."**

A skeptical engineer opening this product would say: *"The chrome is good. The component library is solid. But every surface that's supposed to show me live operational data is fake. The dashboard shows me links, not state. The alerts page has hardcoded timestamps and non-functional buttons. The security audit page is a mobile marketing screen. I can't evaluate this product from this UI because this UI isn't connected to the product."*

The path to "This is real software" requires one thing above all else: replace the hardcoded content in `alerts/page.tsx`, `ControlPlaneOverview.tsx`, `SecurityOverview.tsx`, `PolicyViewer.tsx`, and `IntegrationList.tsx` with either real API-connected data or an explicit, clearly labeled demo mode. The design foundation to support this already exists. The data layer does not.
