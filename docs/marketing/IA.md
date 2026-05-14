# Settler Marketing Information Architecture

> Last updated: 2026-03-08
> Branch: claude/stitch-marketing-unification-okii7

## Canonical Site Structure

```
/                         → Redirects to /(marketing)/home
/(marketing)/home         → Main homepage (the canonical Settler landing page)
/platform                 → Platform overview — deterministic engine + AI review
/how-it-works             → Architecture walkthrough (step-by-step)
/replay-lab               → Feature page: Deterministic Replay Lab
/proof-explorer           → Feature page: Proof Explorer / audit evidence DAG
/pricing                  → Engagement models (OSS, Cloud, Enterprise)
/security-and-audit       → Trust, compliance, and audit documentation
/security                 → Redirect → /security-and-audit
/docs                     → Documentation entry point
/docs/quickstart          → Quickstart guide
/about                    → Company / project background
/contact                  → Contact form
/blog                     → Blog listing
/terms                    → Terms of service
/privacy                  → Privacy policy
```

## Route Groups

| Group              | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `(marketing)/`     | Public-facing marketing surface. Currently contains `home/`. |
| `(authenticated)/` | App routes behind auth. Not marketing.                       |

## Page Ownership Model

### Main Homepage (`/`)

**File:** `packages/web/src/app/(marketing)/home/page.tsx`

Single canonical homepage. Section order:

1. Navigation
2. Hero — product headline, CTAs, trust strip
3. Core Capabilities — 6 capability cards (no feature-page overflow)
4. Developer Workflow — 4-step install → define → run → review
5. Code Example — TypeScript SDK, dark code section
6. Why Settler — 3-card narrative on value
7. Feature Entry Cards — links to Replay Lab, Proof Explorer, How It Works
8. GitHub / Quickstart CTA — dark section, two CTAs
9. FAQ — accordion, 4 questions
10. Footer

**Invariants:**

- Exactly one hero
- Exactly one FAQ block
- Exactly one footer
- Feature-specific longform content lives on feature pages, not here

### Feature Pages

| Route             | File                          | Purpose                         |
| ----------------- | ----------------------------- | ------------------------------- |
| `/how-it-works`   | `app/how-it-works/page.tsx`   | Architecture walkthrough        |
| `/replay-lab`     | `app/replay-lab/page.tsx`     | Deterministic Replay Lab        |
| `/proof-explorer` | `app/proof-explorer/page.tsx` | Proof Explorer + audit evidence |

All feature pages share:

- `<Navigation />` component
- `<Footer />` component
- `bg-slate-50 dark:bg-slate-950` base background
- Dark section for code/terminal examples

### Marketing Support Pages

| Route                 | File                              | Purpose            |
| --------------------- | --------------------------------- | ------------------ |
| `/platform`           | `app/platform/page.tsx`           | Platform overview  |
| `/pricing`            | `app/pricing/page.tsx`            | Engagement models  |
| `/security-and-audit` | `app/security-and-audit/page.tsx` | Trust + compliance |
| `/about`              | `app/about/page.tsx`              | About              |
| `/blog`               | `app/blog/page.tsx`               | Blog               |

## Navigation Model

**Primary nav (desktop + mobile):**

- Platform
- Features ▾ (dropdown: How It Works, Replay Lab, Proof Explorer)
- Pricing
- Security
- Docs

**Secondary nav ("More" dropdown):**

- Contact
- Privacy
- Terms

**Right-side actions:**

- Dark mode toggle
- Login
- Get Started (CTA)

## Footer Structure

| Section  | Links                                                         |
| -------- | ------------------------------------------------------------- |
| Product  | Platform, How It Works, Pricing, Security, Login, Get Started |
| Features | Replay Lab, Proof Explorer, Quickstart, Documentation         |
| Company  | About, Contact, GitHub, Terms, Privacy                        |

## Brand Assets

| Asset                 | Path / implementation                                      | Usage                            |
| --------------------- | ---------------------------------------------------------- | -------------------------------- |
| Logo (in-app)         | `SettlerLogo` → `BrandLockup` (mark PNG + text wordmark)   | Navigation, footer — all themes  |
| Favicon               | `/icon.png` (App Router); `/favicon.ico` → `/icon.png`     | Browser tab                      |
| Favicon (PWA)         | `/brand/settler/favicon-192x192.png`, `manifest.json`     | Metadata, PWA                    |
| OG Image              | `/opengraph-image`                                         | Social preview                   |
| Twitter Card          | `/twitter-image`                                           | Twitter                          |
| Hero Visual           | `/illustrations/hero-visual.svg`          | Homepage hero                    |
| How it works          | `/illustrations/how-settler-works.svg`    | How it works page                |
| Feature illustrations | `/illustrations/feature-*.svg`            | Dev workflow steps               |

## Design System Conventions

- **Colors:** Tailwind with CSS custom properties; primary/teal/neutral scales defined in `tailwind.config.js`
- **Dark mode:** Class-based (`.dark` on `<html>`); cookie + localStorage for persistence
- **Spacing:** Section padding `py-16 sm:py-20 lg:py-24`; max container `max-w-7xl`
- **Cards:** Rounded-2xl, border-slate-200/800, hover shadow transition
- **Code sections:** `bg-slate-900` dark sections for code examples
- **CTAs:** Primary = filled button; secondary = outline button

## Invariants

1. One homepage. No duplicate heroes.
2. Feature-specific longform content lives on feature pages.
3. All feature pages reachable from: homepage feature cards + Features nav dropdown + footer.
4. `/security` redirects to `/security-and-audit` (canonical).
5. `/reconciliation` redirects to `/app/reconciliation` (this is an app route, not marketing).
6. Logo renders correctly in both light and dark mode.
7. Every marketing page has a `<Navigation />` and `<Footer />`.
