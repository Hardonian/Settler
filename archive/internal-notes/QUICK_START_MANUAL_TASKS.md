# Quick Start — Critical Manual Tasks (Next 7 Days)

**Priority Order:** Do these first, in this order

---

## Day 1: Infrastructure Setup (4 hours)

### Morning (2 hours)
1. **Sentry Setup** (30 min)
   - [ ] Create account at sentry.io
   - [ ] Create project: "Settler Web"
   - [ ] Copy DSN
   - [ ] Add to Vercel env vars: `NEXT_PUBLIC_SENTRY_DSN`
   - [ ] Deploy and test

2. **Stripe Setup** (1.5 hours)
   - [ ] Create products in Stripe Dashboard
   - [ ] Copy price IDs
   - [ ] Add to Vercel env vars: `STRIPE_PRICE_ID_PRO`
   - [ ] Set up webhook endpoint
   - [ ] Copy webhook secret
   - [ ] Add to Vercel env vars: `STRIPE_WEBHOOK_SECRET`
   - [ ] Test checkout flow

### Afternoon (2 hours)
3. **Environment Variables** (1 hour)
   - [ ] Review `.env.example`
   - [ ] Set all required vars in Vercel
   - [ ] Generate secrets (JWT_SECRET, ENCRYPTION_KEY)
   - [ ] Verify all vars set

4. **Database Verification** (1 hour)
   - [ ] Check Supabase connection
   - [ ] Verify migrations applied
   - [ ] Test database queries

---

## Day 2: Testing (6 hours)

### Morning (3 hours)
1. **End-to-End Testing** (2 hours)
   - [ ] Test sign-up flow
   - [ ] Test billing flow
   - [ ] Test customer portal
   - [ ] Test API endpoints

### Afternoon (3 hours)
2. **Adapter Testing** (3 hours)
   - [ ] Test Stripe adapter
   - [ ] Test Shopify adapter
   - [ ] Test error scenarios

---

## Day 3: Product Hunt Prep (8 hours)

### Morning (4 hours)
1. **Product Hunt Page** (3 hours)
   - [ ] Create account
   - [ ] Write page content
   - [ ] Add screenshots
   - [ ] Create demo video (optional)

### Afternoon (4 hours)
2. **Launch Materials** (4 hours)
   - [ ] Build email list (target: 500)
   - [ ] Write social media posts
   - [ ] Prepare Hacker News post
   - [ ] Prepare Indie Hackers post

---

## Day 4: Content Creation (6 hours)

1. **Blog Post 1** (2 hours)
   - [ ] Write "Building a Reconciliation API: Lessons Learned"
   - [ ] Publish on Dev.to/Hashnode
   - [ ] Share on social media

2. **Blog Post 2** (2 hours)
   - [ ] Write "Why We Built Settler"
   - [ ] Publish and share

3. **Blog Post 3** (2 hours)
   - [ ] Write "Stripe + Shopify Reconciliation Guide"
   - [ ] Publish and share

---

## Day 5: Email & Social Setup (4 hours)

1. **Email Platform** (2 hours)
   - [ ] Set up Resend account
   - [ ] Verify domain
   - [ ] Create email templates
   - [ ] Add to Vercel env vars

2. **Social Media** (2 hours)
   - [ ] Create Twitter/X account
   - [ ] Create LinkedIn page (optional)
   - [ ] Set up profiles
   - [ ] Post first updates

---

## Day 6: Monitoring & Alerts (2 hours)

1. **Set Up Alerts** (2 hours)
   - [ ] Sentry alerts (critical errors)
   - [ ] Stripe alerts (failed payments)
   - [ ] Uptime monitoring (optional)

---

## Day 7: Final Prep & Launch (8 hours)

### Morning (4 hours)
1. **Final Testing** (2 hours)
   - [ ] Test all critical flows
   - [ ] Verify error handling
   - [ ] Check performance

2. **Launch Prep** (2 hours)
   - [ ] Review Product Hunt page
   - [ ] Prepare launch day schedule
   - [ ] Set reminders

### Afternoon (4 hours)
3. **Launch Product Hunt** (4 hours)
   - [ ] Post at 12:01 AM PST
   - [ ] Share on all channels
   - [ ] Engage with comments
   - [ ] Monitor metrics

---

## Week 1 Success Criteria

- [ ] Sentry working
- [ ] Stripe integration tested
- [ ] Product Hunt launched
- [ ] 3 blog posts published
- [ ] Email platform configured
- [ ] Social media active
- [ ] 200+ Product Hunt upvotes
- [ ] 500+ signups

---

**Total Time:** ~40 hours over 7 days  
**Focus:** Infrastructure → Testing → Launch → Content
