# Settler White-Label — Enterprise Outreach & Pilot Materials

## Enterprise Outreach Template

### Cold Outreach (Fintech CTO / VP Engineering)

**Subject:** Reconciliation-as-a-Service for [Company] — white-label pilot

Hi [Name],

I noticed [Company] offers payment infrastructure to merchants. Most platforms I talk to struggle with reconciliation — their merchants need audit-ready evidence, but building it in-house takes 6-12 months.

I built Settler, a reconciliation engine that can be white-labeled and embedded into your platform. It handles:

- Stripe/bank/PSP matching (deterministic rules engine)
- Exception detection and workflow routing
- Audit-ready evidence bundles (timestamps, SHA-256 hashes, PDF reports)
- Multi-tenant isolation (your merchants never see each other's data)

We're offering a 30-day design pilot — free access, white-glove setup, and you keep the evidence bundle whether or not you continue.

The pilot is capped at 5 companies. Interested?

— Scott

---

### Follow-Up (If No Response — 5 Days Later)

**Subject:** Quick follow-up + Settler white-label demo

Hey [Name],

Just circling back on the white-label reconciliation pilot. Here's what you'd get:

1. White-labeled Settler instance (your branding, your domain)
2. Stripe webhook integration (15-min setup)
3. Automated matching + exception detection
4. Audit-ready evidence bundle (PDF + JSON)
5. 30 days free — no credit card

The pilot is capped at 5 companies. Let me know if you want in.

— Scott

---

## White-Label Configuration Guide

### For Enterprise Pilots

Settler supports full white-labeling via the TenantThemeProvider system:

**Branding Configuration:**

```json
{
  "primaryColor": "#1a1a2e",
  "secondaryColor": "#16213e",
  "accentColor": "#0f3460",
  "backgroundColor": "#ffffff",
  "fontFamilyPrimary": "Inter",
  "fontFamilySecondary": "JetBrains Mono",
  "borderRadiusScale": 1.0,
  "logoUrl": "https://your-domain.com/logo.svg",
  "faviconUrl": "https://your-domain.com/favicon.ico"
}
```

**Custom Domain Setup:**

1. Add CNAME record: `reconciliation.your-domain.com` → `app.settler.dev`
2. Configure in Settler console: Settings → Custom Domain
3. SSL auto-provisioned via Let's Enterprise

**API White-Labeling:**

- All API responses include `X-Powered-By: Settler` header (can be disabled)
- Webhook URLs configurable per tenant
- Custom email templates for notifications

---

## Pilot Onboarding Checklist

### Pre-Pilot (Day 0)

- [ ] Sign design partner agreement
- [ ] Collect branding assets (logo, colors, fonts)
- [ ] Configure white-label instance
- [ ] Set up custom domain (if requested)
- [ ] Create Stripe products for pilot pricing

### Onboarding (Day 1)

- [ ] 30-min kickoff call
- [ ] Stripe webhook integration (15-min setup)
- [ ] Import historical data (if available)
- [ ] Configure reconciliation rules
- [ ] Set up exception workflow

### Pilot Period (Days 2-28)

- [ ] Weekly 15-min check-in calls
- [ ] Monitor reconciliation accuracy
- [ ] Collect feedback on UX/features
- [ ] Iterate on configuration

### Pilot End (Day 30)

- [ ] Generate final evidence bundle
- [ ] Present pilot results (accuracy, time saved, exceptions caught)
- [ ] Discuss continuation options
- [ ] If continuing: migrate to production pricing
- [ ] If not: provide data export + handoff

---

## Enterprise Pricing Tiers

| Tier       | Monthly Price | Reconciliations/mo | Support   | SLA    |
| ---------- | ------------- | ------------------ | --------- | ------ |
| Growth     | $99/mo        | 100,000            | Email     | 99.9%  |
| Scale      | $990/mo       | 1,000,000          | Priority  | 99.95% |
| Enterprise | Custom        | Unlimited          | Dedicated | 99.99% |

**Enterprise Add-Ons:**

- White-label branding: +$200/mo
- Custom domain: +$50/mo
- Dedicated support: +$300/mo
- SLA upgrade to 99.99%: +$500/mo
