# Daily Operations Checklist

**Print this or keep it open daily**

---

## 🌅 Morning Routine (15 minutes)

### Infrastructure Health
- [ ] **Vercel Status**
  - Check: https://vercel.com/dashboard
  - Verify: Latest deployment successful
  - Action if failed: Review logs, redeploy

- [ ] **Stripe Dashboard**
  - Check: https://dashboard.stripe.com/payments
  - Verify: No failed payments
  - Action if failed: Contact customer, retry payment

- [ ] **Sentry Errors**
  - Check: https://sentry.io/
  - Verify: No new critical errors
  - Action if errors: Review, fix, deploy

- [ ] **Supabase Health**
  - Check: https://supabase.com/dashboard
  - Verify: Database healthy, no alerts
  - Action if issues: Check logs, contact support

### Business Metrics
- [ ] **New Signups**
  - Check: Supabase Dashboard → Authentication → Users
  - Count: New users since yesterday
  - Action: Welcome email (if automated)

- [ ] **New Customers**
  - Check: Stripe Dashboard → Customers
  - Count: New paying customers
  - Action: Send welcome email, offer onboarding

- [ ] **Revenue**
  - Check: Stripe Dashboard → Payments
  - Calculate: MRR (Monthly Recurring Revenue)
  - Track: Growth vs. previous day/week

---

## 📧 Support & Communication (30 minutes)

### Customer Support
- [ ] **Check Support Email**
  - Check: support@settler.io (or your support email)
  - Respond: Within 24 hours (target: same day)
  - Escalate: Critical issues immediately

- [ ] **Review Support Tickets** (if using help desk)
  - Check: Zendesk, Help Scout, or your help desk
  - Prioritize: By severity and customer value
  - Respond: Per SLA (Free: 48h, Commercial: 24h)

### Social Media
- [ ] **Twitter/X**
  - Check: Mentions, DMs, replies
  - Respond: Within 4 hours
  - Post: 1-2 updates (if scheduled)

- [ ] **LinkedIn** (if using)
  - Check: Messages, comments
  - Respond: Within 24 hours
  - Post: 1 update (if scheduled)

---

## 📊 Weekly Tasks (Do Once Per Week)

### Monday: Metrics Review (1 hour)
- [ ] **Subscription Metrics**
  - Churn rate (target: <5%)
  - New subscriptions
  - Upgrades/downgrades
  - MRR growth

- [ ] **Usage Metrics**
  - API calls (reconcile, receipts, flags)
  - Active users
  - Feature usage
  - Identify trends

- [ ] **Error Metrics**
  - Error rate (target: <1%)
  - Top errors
  - Resolution time
  - Identify patterns

### Tuesday: Content Creation (2 hours)
- [ ] **Blog Post** (if weekly schedule)
  - Write draft
  - Edit and proofread
  - Publish
  - Share on social media

- [ ] **Social Media**
  - Schedule posts for week
  - Engage with community
  - Share relevant content

### Wednesday: Product Improvements (2 hours)
- [ ] **Review Customer Feedback**
  - Categorize feedback
  - Prioritize improvements
  - Plan implementation

- [ ] **Fix Bugs**
  - Review bug reports
  - Fix high-priority bugs
  - Deploy fixes

### Thursday: Marketing (2 hours)
- [ ] **Community Engagement**
  - Hacker News: Post or engage
  - Indie Hackers: Post or engage
  - Reddit: Post or engage
  - Twitter: Daily engagement

- [ ] **Partnerships**
  - Follow up on partner applications
  - Reach out to potential partners
  - Co-marketing opportunities

### Friday: Planning & Review (1 hour)
- [ ] **Week Review**
  - What went well?
  - What didn't?
  - What to improve?

- [ ] **Next Week Planning**
  - Set goals
  - Plan tasks
  - Schedule time blocks

---

## 📅 Monthly Tasks (Do Once Per Month)

### First Week: Financial Review
- [ ] **Billing Reconciliation**
  - Stripe Dashboard → Payments
  - Verify all payments processed
  - Check for discrepancies
  - Reconcile with database

- [ ] **Revenue Analysis**
  - Calculate MRR
  - Calculate ARR
  - Track growth rate
  - Compare to targets

- [ ] **Cost Analysis**
  - Vercel costs
  - Supabase costs
  - Upstash costs
  - Stripe fees
  - Total infrastructure costs
  - Calculate unit economics

### Second Week: Customer Success
- [ ] **Customer Feedback Analysis**
  - Review all feedback from previous month
  - Categorize (feature requests, bugs, UX)
  - Prioritize improvements
  - Update roadmap

- [ ] **Churn Analysis**
  - Identify churned customers
  - Analyze churn reasons
  - Create retention strategies
  - Implement improvements

- [ ] **NPS Survey** (if implemented)
  - Send NPS survey to customers
  - Analyze responses
  - Calculate NPS score
  - Identify promoters/detractors

### Third Week: Product Improvements
- [ ] **Feature Development**
  - Implement high-priority features
  - Test thoroughly
  - Deploy to production
  - Announce to customers

- [ ] **Documentation Updates**
  - Update API docs
  - Update integration guides
  - Update troubleshooting guide
  - Keep docs current

### Fourth Week: Growth & Planning
- [ ] **GTM Review**
  - Review GTM strategy
  - Analyze what's working
  - Identify improvements
  - Plan next month

- [ ] **Content Planning**
  - Plan next month's blog posts
  - Schedule social media
  - Plan Product Hunt launches
  - Plan partnerships

- [ ] **Team Planning** (if applicable)
  - Review team performance
  - Plan hiring (if needed)
  - Set goals for next month

---

## 🚨 Emergency Procedures

### If Service is Down
1. [ ] Check Vercel status page
2. [ ] Check Supabase status page
3. [ ] Check Stripe status page
4. [ ] Review Vercel logs
5. [ ] Rollback if needed
6. [ ] Notify users (status page, email)

### If Billing Fails
1. [ ] Check Stripe dashboard
2. [ ] Review webhook events
3. [ ] Check database subscriptions
4. [ ] Manually sync if needed
5. [ ] Contact affected customers

### If Security Breach
1. [ ] Rotate all secrets immediately
2. [ ] Revoke compromised keys
3. [ ] Review access logs
4. [ ] Document incident
5. [ ] Notify affected users (if PII breach)

---

## 📈 Success Metrics to Track Daily

### Technical Metrics
- **API Success Rate:** Target >99%
- **Error Rate:** Target <1%
- **Response Time:** Target <500ms (p95)
- **Uptime:** Target >99.9%

### Business Metrics
- **New Signups:** Track daily
- **New Customers:** Track daily
- **MRR:** Track daily
- **Churn Rate:** Track weekly (target: <5%)
- **Activation Rate:** Track weekly (target: 60%+)

### User Experience Metrics
- **Support Response Time:** Track daily (target: <24h)
- **Customer Satisfaction:** Track monthly (target: >4.5/5)
- **NPS:** Track monthly (target: >50)

---

## 💡 Tips

### Time Management
- **Batch similar tasks** (e.g., check all dashboards at once)
- **Set specific times** for each task (e.g., 9 AM: Infrastructure check)
- **Use templates** for repetitive tasks (emails, social posts)
- **Automate what you can** (alerts, notifications)

### Prioritization
- **Critical issues first** (service down, billing failures)
- **Customer-facing issues second** (support, bugs)
- **Improvements third** (features, optimizations)

### Avoid Burnout
- **Set boundaries** (e.g., no work after 6 PM)
- **Take breaks** (e.g., 10 min every hour)
- **Delegate when possible** (hire help when revenue allows)
- **Focus on high-impact tasks** (customer acquisition > perfecting code)

---

## 📝 Notes Section

**Use this space to jot down:**
- Issues encountered
- Ideas for improvements
- Customer feedback
- Things to follow up on

---

**Print this checklist and check off items daily!**

**Last Updated:** January 2026
