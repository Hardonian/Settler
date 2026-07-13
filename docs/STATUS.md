# Settler Release Status

v0.8.0: PRODUCTION-READY BILLING

- ✅ Live Stripe checkout sessions (API tier + Web tier)
- ✅ Webhook handler with signature verification + tenant tier auto-update
- ✅ Stripe price setup script: scripts/setup_stripe_prices.py
- ✅ Tenant isolation: TenantService + QuotaService + usage sync
- ✅ Billing portal (web tier): self-serve upgrade/downgrade
- ✅ Stripe usage sync for metered billing

PENDING (requires Stripe account):

- 🔲 Run scripts/setup_stripe_prices.py with live STRIPE_SECRET_KEY
- 🔲 Copy price IDs to .env.local (API) and Vercel (Web)
- 🔲 Deploy webhook endpoint in Stripe dashboard → https://api.settler.dev/api/stripe/webhook
- 🔲 Deploy to Fly.io / Vercel

DESIGN PARTNER:

- 🔲 Onboard 1 design partner (fintech with Stripe)
- 🔲 30-day white-glove pilot
- 🔲 Case study after pilot
