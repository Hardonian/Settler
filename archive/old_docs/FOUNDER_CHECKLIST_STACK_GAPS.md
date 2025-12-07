# Founder Checklist: Stack Setup & Gaps

**Last Updated:** 2025-01-XX  
**Purpose:** Non-technical guide for setting up Settler's production infrastructure

---

## 🎯 Quick Status

**Current State:**

- ✅ Code is ready for production
- ⚠️ External services need to be provisioned
- ⚠️ Environment variables need to be set
- ⚠️ Some features need manual configuration

**Estimated Setup Time:** 2-4 hours  
**Estimated Monthly Cost:** $75-100 (small scale) or $0 (free tier for testing)

---

## 📋 Priority Checklist

### 🔴 HIGH PRIORITY (Must Do Before Real Users)

These are **critical** for security and core functionality.

#### 1. Supabase Setup (Database & Auth)

**Time:** 30 minutes  
**Cost:** Free tier available

**Steps:**

1. Go to [supabase.com](https://supabase.com) and create account
2. Click "New Project"
3. Fill in:
   - Name: "Settler Production"
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users
4. Wait 2-3 minutes for project to be created
5. Go to **Settings** → **API**
6. Copy these 3 values:
   - **Project URL** (looks like: `https://abc123.supabase.co`)
   - **anon/public key** (long string starting with `eyJ`)
   - **service_role key** (long string starting with `eyJ` - keep this secret!)

**Set in Vercel:**

- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add:
  - `SUPABASE_URL` = your project URL
  - `SUPABASE_ANON_KEY` = your anon key
  - `SUPABASE_SERVICE_ROLE_KEY` = your service role key

**Run Migrations:**

- Contact your developer or follow `docs/infra-setup.md` section 1

**✅ Done when:** Database tables are created and you can see them in Supabase Dashboard → Table Editor

---

#### 2. Upstash Redis Setup (Job Queues)

**Time:** 15 minutes  
**Cost:** Free tier (10K commands/day) or ~$6-10/month

**Why:** Required for background job processing (reconciliation, webhooks, etc.)

**Steps:**

1. Go to [console.upstash.com](https://console.upstash.com) and create account
2. Click "Create Database"
3. Fill in:
   - Name: "settler-redis"
   - Type: Regional
   - Region: Same as Supabase
   - Plan: Free (or Pay-as-you-go)
4. After creation, click on your database
5. Copy these values:
   - **REST URL** (looks like: `https://abc123.upstash.io`)
   - **REST Token** (starts with `AX`)
   - **TCP Endpoint** (looks like: `abc123.upstash.io:6379`)
   - **TCP Password** (long password string)

**Set in Vercel:**

- `UPSTASH_REDIS_REST_URL` = REST URL
- `UPSTASH_REDIS_REST_TOKEN` = REST Token
- `REDIS_HOST` = TCP endpoint hostname (without `:6379`)
- `REDIS_PORT` = `6379`
- `REDIS_PASSWORD` = TCP Password
- `REDIS_TLS` = `true`

**✅ Done when:** Redis connection test passes (ask developer to verify)

---

#### 3. Resend Email Setup (Transactional Emails) ✅

**Time:** 5 minutes (you already have the API key!)  
**Cost:** Free tier (100 emails/day) or $20/month for 50K emails

**Why:** Required for sign-up verification, password reset, welcome emails

**✅ You Already Have:**

- API Key: `re_jD36Bjud_DcRF2FJuajKNrPVVTy8pQsYp`

**Set in Vercel:**

- `RESEND_API_KEY` = `re_jD36Bjud_DcRF2FJuajKNrPVVTy8pQsYp`
- `RESEND_FROM_EMAIL` = `onboarding@resend.dev` (test domain - works immediately)
- `RESEND_FROM_NAME` = `Settler`

**For Production (Later):**

- Go to [resend.com/domains](https://resend.com/domains)
- Add your domain (e.g., `settler.dev`)
- Add DNS records as instructed (TXT, MX records)
- Wait for verification (can take 24 hours)
- Update `RESEND_FROM_EMAIL` to `noreply@yourdomain.com`

**✅ Done when:** Variable is set in Vercel (test email can be sent to verify)

---

#### 4. Security Keys Setup

**Time:** 5 minutes  
**Cost:** Free

**Why:** Required for production security\*\*

**On Mac/Linux Terminal:**

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate Encryption Key (exactly 32 characters)
openssl rand -hex 16
```

**On Windows (PowerShell):**

```powershell
# Generate JWT Secret
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Generate Encryption Key
-join ((1..16 | ForEach-Object { '{0:X2}' -f (Get-Random -Maximum 256) }))
```

**Set in Vercel:**

- `JWT_SECRET` = generated JWT secret
- `ENCRYPTION_KEY` = generated encryption key (must be exactly 32 characters)

**✅ Done when:** Both keys are set (never use default values in production!)

---

### 🟡 MEDIUM PRIORITY (Improves Reliability)

These improve monitoring and reliability but aren't blocking.

#### 5. Sentry Error Tracking (Optional but Recommended)

**Time:** 15 minutes  
**Cost:** Free tier (5K events/month) or $26/month

**Why:** Automatically captures and alerts on errors in production

**Steps:**

1. Go to [sentry.io](https://sentry.io) and create account
2. Click "Create Project"
3. Select: **Node.js** platform
4. Name it: "Settler API"
5. Copy the **DSN** (looks like: `https://abc@123.ingest.sentry.io/456`)

**Set in Vercel:**

- `SENTRY_DSN` = your DSN
- `SENTRY_ENVIRONMENT` = `production`
- `SENTRY_TRACES_SAMPLE_RATE` = `0.1`

**✅ Done when:** Errors appear in Sentry dashboard (trigger a test error)

---

#### 6. Supabase Storage Setup (Optional)

**Time:** 10 minutes  
**Cost:** Included in Supabase plan

**Why:** Needed if you want to store file exports, user uploads, etc.

**Steps:**

1. In Supabase Dashboard → **Storage**
2. Create buckets:
   - `exports` (Private)
   - `uploads` (Private)
   - `public-assets` (Public - optional)

**✅ Done when:** Buckets are created (can be done later if not needed immediately)

---

#### 7. Supabase Edge Functions (Optional)

**Time:** 30 minutes (developer task)  
**Cost:** Included in Supabase plan

**Why:** Needed for scheduled tasks (data cleanup, webhook retries, etc.)

**Status:** Not implemented yet - see `docs/supabase-gaps.md` for details

**Action:** Can be done later, but recommended for production

---

### 🟢 LOW PRIORITY (Nice to Have)

#### 8. Log Aggregation (Optional)

**Time:** 15 minutes  
**Cost:** Free tier available

**Options:**

- **Logflare** (Supabase-integrated) - Free tier
- **Datadog** - $31/month starter
- **Vercel Logs** - Built-in (may be sufficient)

**Action:** Can be done later - Vercel logs may be sufficient initially

---

#### 9. Uptime Monitoring (Optional)

**Time:** 10 minutes  
**Cost:** Free

**Options:**

- **UptimeRobot** - Free (50 monitors)
- **Pingdom** - Paid
- **StatusCake** - Free tier available

**Steps:**

1. Sign up for UptimeRobot
2. Add monitor:
   - URL: `https://your-api.vercel.app/health`
   - Check interval: 5 minutes
   - Alert email: your email

**✅ Done when:** Monitor is active and alerts work

---

## 📊 Summary: What You Need

### Minimum for Testing (Free Tier)

- ✅ Supabase (Free)
- ✅ Upstash Redis (Free - 10K commands/day)
- ✅ Resend (Free - 100 emails/day)
- ✅ Security keys (Free)

**Total Cost:** $0/month  
**Setup Time:** ~1 hour

### Production Ready (Small Scale)

- ✅ Supabase Pro ($25/month)
- ✅ Upstash Redis (~$6-10/month)
- ✅ Resend ($20/month)
- ✅ Sentry ($26/month)
- ✅ Security keys (Free)

**Total Cost:** ~$75-100/month  
**Setup Time:** ~2-3 hours

---

## 🚨 Common Issues & Solutions

### Issue: "Supabase connection failed"

**Solution:**

- Check `SUPABASE_URL` is correct (no trailing slash)
- Verify API keys are copied correctly (no extra spaces)
- Check Supabase project is running (Dashboard → Project Status)

### Issue: "Redis connection timeout"

**Solution:**

- Verify `REDIS_TLS=true` is set (required for Upstash)
- Check `REDIS_HOST` doesn't include `https://` (just hostname)
- Verify TCP password (not REST token) is used for `REDIS_PASSWORD`

### Issue: "Email not sending"

**Solution:**

- Check `RESEND_API_KEY` is correct
- Verify `RESEND_FROM_EMAIL` matches verified domain (or use test domain)
- Check Resend dashboard for delivery status

### Issue: "Migrations failed"

**Solution:**

- Check `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- Verify database is accessible (Supabase Dashboard)
- Check migration logs for specific errors

---

## 📚 Additional Resources

### Documentation

- **Stack Overview:** `docs/stack-overview.md`
- **Supabase Gaps:** `docs/supabase-gaps.md`
- **Redis Decision:** `docs/redis-decision.md`
- **Infrastructure Setup:** `docs/infra-setup.md`
- **Background Jobs:** `docs/background-jobs.md`
- **Observability:** `docs/observability.md`

### Support

- **Supabase Support:** [supabase.com/support](https://supabase.com/support)
- **Upstash Support:** [docs.upstash.com](https://docs.upstash.com)
- **Resend Support:** [resend.com/support](https://resend.com/support)
- **Sentry Support:** [sentry.io/support](https://sentry.io/support)

---

## ✅ Final Checklist

Before going live with real users:

- [ ] Supabase project created and migrations run
- [ ] Upstash Redis database created and connected
- [ ] Resend API key set and test email sent
- [ ] Security keys generated (JWT_SECRET, ENCRYPTION_KEY)
- [ ] All environment variables set in Vercel
- [ ] Health check endpoint works (`/health`)
- [ ] Test sign-up flow (creates user, sends verification email)
- [ ] Test password reset flow (sends reset email)
- [ ] Error tracking configured (Sentry - optional but recommended)
- [ ] Uptime monitoring set up (optional but recommended)

---

## 🎉 You're Done!

Once all HIGH PRIORITY items are complete, your stack is production-ready!

**Next Steps:**

1. Test all core flows (sign-up, login, reconciliation)
2. Monitor error rates in Sentry (if set up)
3. Check logs for any issues
4. Gradually roll out to users

**Remember:**

- Start with free tiers to test
- Upgrade to paid plans as you scale
- Monitor costs monthly
- Set up alerts for critical issues

Good luck! 🚀
