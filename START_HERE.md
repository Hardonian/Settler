# 🚀 START HERE - Billing System Deployment

## ⚡ Quick Start (2 Steps)

### 1. Add GitHub Secrets (5 minutes)

**Go to:** GitHub Repo → Settings → Secrets and variables → Actions → New repository secret

**Add these 8 secrets:**

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_REF=xxx
SUPABASE_ACCESS_TOKEN=xxx
STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (add after first deploy)
```

**📖 Detailed instructions:** See `GITHUB_SECRETS_SETUP.md`

---

### 2. Commit to Main

```bash
git add .
git commit -m "feat: Complete billing system with auto-deployment"
git push origin main
```

**That's it!** 🎉

---

## 🤖 What Happens Automatically

GitHub Actions will automatically:

1. ✅ Run database migrations
2. ✅ Seed 10 add-ons
3. ✅ Create Stripe products
4. ✅ Deploy 8 edge functions
5. ✅ Initialize billing system
6. ✅ Verify deployment

**Time: ~5-10 minutes**

---

## 📝 After First Deploy

### Configure Stripe Webhook (One-Time)

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. URL: `https://your-domain.com/api/billing/webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `invoice.upcoming`
5. Copy the **webhook secret** (`whsec_...`)
6. Add to GitHub Secrets as `STRIPE_WEBHOOK_SECRET`
7. Push again or re-run workflow

---

## ✅ Verify It Works

```bash
# Check setup
npx tsx scripts/check-billing-setup.ts
```

Or visit:
- `/dashboard/billing`
- `/dashboard/addons`
- `/dashboard/usage`

---

## 📚 Documentation

- **Secrets Setup:** `GITHUB_SECRETS_SETUP.md`
- **Deployment Guide:** `DEPLOYMENT_SETUP.md`
- **Quick Start:** `QUICK_START.md`
- **Complete Report:** `COMPLETE_BILLING_IMPLEMENTATION_REPORT.md`

---

## 🆘 Troubleshooting

**Migrations fail?**
- Check `DATABASE_URL` format
- Verify Supabase credentials

**Stripe products not created?**
- Verify `STRIPE_SECRET_KEY` is set
- Run manually: `npm run billing:setup-stripe`

**Edge functions not deploying?**
- Check `SUPABASE_ACCESS_TOKEN`
- Verify `SUPABASE_PROJECT_REF`

**Check logs:** GitHub → Actions → View workflow run

---

## 🎊 Ready to Deploy!

**Everything is complete and automated. Just add secrets and push!**

---

**Next:** Open `GITHUB_SECRETS_SETUP.md` to add your secrets → Then commit to main!
