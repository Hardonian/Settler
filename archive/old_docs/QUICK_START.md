# ⚡ Quick Start - Billing System Deployment

## 🎯 What You Need to Do

**Just 2 steps:**

### Step 1: Add GitHub Secrets (5 minutes)

Go to: **GitHub Repo → Settings → Secrets and variables → Actions**

Add these 8 secrets (see `GITHUB_SECRETS_SETUP.md` for details):

1. `DATABASE_URL`
2. `SUPABASE_URL`
3. `SUPABASE_ANON_KEY`
4. `SUPABASE_SERVICE_ROLE_KEY`
5. `SUPABASE_PROJECT_REF`
6. `SUPABASE_ACCESS_TOKEN`
7. `STRIPE_SECRET_KEY`
8. `STRIPE_WEBHOOK_SECRET` (add after first deploy)

### Step 2: Commit to Main

```bash
git add .
git commit -m "feat: Complete billing system with auto-deployment"
git push origin main
```

**Done!** 🎉

---

## 🤖 What Happens Automatically

When you push, GitHub Actions will:

1. ✅ Run database migrations
2. ✅ Seed add-ons (10 integrations)
3. ✅ Create Stripe products
4. ✅ Deploy edge functions
5. ✅ Initialize billing system
6. ✅ Verify deployment

**Total time: ~5-10 minutes**

---

## 📋 After First Deploy

### Configure Stripe Webhook (One-Time)

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://your-domain.com/api/billing/webhook`
3. Select events: `customer.subscription.*`, `invoice.*`
4. Copy webhook secret
5. Add to GitHub Secrets as `STRIPE_WEBHOOK_SECRET`
6. Push again or re-run workflow

---

## ✅ Verify It Works

```bash
# Check setup
npx tsx scripts/check-billing-setup.ts
```

Or visit:

- `/dashboard/billing` - Billing dashboard
- `/dashboard/addons` - Add-ons marketplace
- `/dashboard/usage` - Usage dashboard

---

## 🆘 Need Help?

- **Secrets setup:** See `GITHUB_SECRETS_SETUP.md`
- **Deployment details:** See `DEPLOYMENT_SETUP.md`
- **Troubleshooting:** Check GitHub Actions logs

---

**That's it! Add secrets → Commit → Deploy automatically! 🚀**
