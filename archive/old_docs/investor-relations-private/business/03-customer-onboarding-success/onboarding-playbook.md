# Customer Onboarding Playbook: Day 1 to First Value

**Version:** 1.0  
**Last Updated:** January 2026

---

## Onboarding Overview

**Goal:** Get customers from signup to first successful reconciliation in <24 hours.

**Success Metrics:**

- Time to first value: <24 hours
- Activation rate: 60%+ (created first job within 7 days)
- Engagement rate: 80%+ (weekly active users)
- Customer satisfaction: NPS >50

---

## Onboarding Phases

### Phase 1: Signup & Account Creation (Day 1, Hour 0-1)

**Goal:** Create account and get API key

**Steps:**

1. **Sign Up**
   - Visit [settler.io/signup](https://settler.io/signup)
   - Enter email and password
   - Verify email address
   - Complete profile (name, company)

2. **Get API Key**
   - Navigate to Settings → API Keys
   - Create new API key
   - Copy API key (save securely)
   - Set API key permissions (read, write, admin)

3. **Welcome Email**
   - Check email for welcome message
   - Review getting started guide
   - Access interactive playground

**Success Criteria:**

- ✅ Account created
- ✅ Email verified
- ✅ API key generated
- ✅ Welcome email received

**Time:** 5-10 minutes

---

### Phase 2: First Integration (Day 1, Hour 1-2)

**Goal:** Install SDK and create first reconciliation job

**Steps:**

1. **Install SDK**

   ```bash
   npm install @settler/sdk
   ```

2. **Initialize Client**

   ```typescript
   import Settler from "@settler/sdk";

   const client = new Settler({
     apiKey: process.env.SETTLER_API_KEY,
   });
   ```

3. **Create First Job**

   ```typescript
   const job = await client.jobs.create({
     name: "Shopify-Stripe Reconciliation",
     source: {
       adapter: "shopify",
       config: { apiKey: process.env.SHOPIFY_API_KEY },
     },
     target: {
       adapter: "stripe",
       config: { apiKey: process.env.STRIPE_SECRET_KEY },
     },
     rules: {
       matching: [
         { field: "order_id", type: "exact" },
         { field: "amount", type: "exact", tolerance: 0.01 },
       ],
       conflictResolution: "last-wins",
     },
   });
   ```

4. **Test Connection**
   - Verify adapter connectivity
   - Test API endpoints
   - Validate configuration

**Success Criteria:**

- ✅ SDK installed
- ✅ Client initialized
- ✅ First job created
- ✅ Adapters connected

**Time:** 15-30 minutes

---

### Phase 3: First Reconciliation (Day 1, Hour 2-3)

**Goal:** Run first successful reconciliation

**Steps:**

1. **Run Reconciliation**

   ```typescript
   await client.jobs.run(job.data.id);
   ```

2. **Get Report**

   ```typescript
   const report = await client.reports.get(job.data.id);
   console.log(report.data.summary);
   ```

3. **Review Results**
   - Check matched transactions
   - Review unmatched transactions
   - Address any errors
   - Validate accuracy

4. **Set Up Webhooks** (Optional)
   ```typescript
   await client.webhooks.create({
     url: "https://your-app.com/webhooks/reconcile",
     events: ["reconciliation.matched", "reconciliation.mismatch"],
   });
   ```

**Success Criteria:**

- ✅ First reconciliation completed
- ✅ Report generated
- ✅ Results reviewed
- ✅ Accuracy validated (95%+)

**Time:** 15-30 minutes

---

### Phase 4: Production Setup (Day 1-7)

**Goal:** Move to production use

**Steps:**

1. **Configure Production Environment**
   - Set up production API keys
   - Configure environment variables
   - Set up monitoring and alerts

2. **Set Up Scheduled Jobs**

   ```typescript
   await client.jobs.update(job.data.id, {
     schedule: {
       frequency: "daily",
       time: "09:00 UTC",
     },
   });
   ```

3. **Configure Alerts**
   - Set up email alerts for mismatches
   - Configure Slack/webhook notifications
   - Set up monitoring dashboards

4. **Test Production Workflow**
   - Run production reconciliation
   - Validate results
   - Test error handling
   - Verify alerts

**Success Criteria:**

- ✅ Production environment configured
  - ✅ Scheduled jobs set up
  - ✅ Alerts configured
  - ✅ Production workflow tested

**Time:** 1-2 hours

---

## Onboarding Checklist

### Day 1 Checklist

- [ ] Account created
- [ ] Email verified
- [ ] API key generated
- [ ] SDK installed
- [ ] First job created
- [ ] Adapters connected
- [ ] First reconciliation completed
- [ ] Report reviewed
- [ ] Welcome email received

### Day 2-7 Checklist

- [ ] Production environment configured
- [ ] Scheduled jobs set up
- [ ] Alerts configured
- [ ] Production workflow tested
- [ ] Team members invited
- [ ] Documentation reviewed
- [ ] Support channels accessed
- [ ] Feedback provided

---

## Onboarding Resources

### Documentation

**Getting Started:**

- [Quick Start Guide](https://docs.settler.io/quick-start)
- [API Reference](https://docs.settler.io/api)
- [SDK Documentation](https://docs.settler.io/sdk)
- [Adapter Guide](https://docs.settler.io/adapters)

**Tutorials:**

- [Shopify-Stripe Reconciliation](https://docs.settler.io/tutorials/shopify-stripe)
- [QuickBooks Integration](https://docs.settler.io/tutorials/quickbooks)
- [Webhook Setup](https://docs.settler.io/tutorials/webhooks)
- [Scheduled Jobs](https://docs.settler.io/tutorials/scheduled-jobs)

**Best Practices:**

- [Reconciliation Best Practices](https://docs.settler.io/best-practices)
- [Error Handling](https://docs.settler.io/error-handling)
- [Performance Optimization](https://docs.settler.io/performance)

### Interactive Resources

**Playground:**

- [Interactive Playground](https://settler.io/playground)
- Try API without signup
- Test adapters and configurations
- View sample code

**Examples:**

- [Code Examples](https://docs.settler.io/examples)
- [Integration Recipes](https://docs.settler.io/recipes)
- [Case Studies](https://docs.settler.io/case-studies)

### Support

**Community:**

- [Discord](https://discord.gg/settler)
- [GitHub Discussions](https://github.com/settler/settler/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/settler)

**Support:**

- Email: [support@settler.io](mailto:support@settler.io)
- Documentation: [docs.settler.io](https://docs.settler.io)
- Status Page: [status.settler.io](https://status.settler.io)

---

## Onboarding Emails

### Email 1: Welcome Email (Immediate)

**Subject:** Welcome to Settler! Let's get you started

**Body:**

```
Hi [Name],

Welcome to Settler! We're excited to help you automate your reconciliation.

Here's what to do next:

1. Get your API key: [Link to API keys]
2. Install the SDK: npm install @settler/sdk
3. Try the playground: [Link to playground]
4. Read the docs: [Link to docs]

Need help? Reply to this email or join our Discord: [Link]

Happy reconciling!
The Settler Team
```

---

### Email 2: First Job Reminder (Day 2)

**Subject:** Create your first reconciliation job

**Body:**

```
Hi [Name],

You're one step away from your first reconciliation!

Here's a quick guide:
1. Create a job: [Link to guide]
2. Connect your adapters: [Link to adapters]
3. Run your first reconciliation: [Link to guide]

Need help? We're here: [Link to support]

The Settler Team
```

---

### Email 3: First Reconciliation Success (Day 3)

**Subject:** 🎉 Your first reconciliation is complete!

**Body:**

```
Hi [Name],

Congratulations! You've completed your first reconciliation.

Here's what's next:
1. Set up scheduled jobs: [Link to guide]
2. Configure alerts: [Link to guide]
3. Invite your team: [Link to team]

Questions? We're here: [Link to support]

The Settler Team
```

---

### Email 4: Production Setup (Day 7)

**Subject:** Ready for production? Let's set it up

**Body:**

```
Hi [Name],

Ready to move to production? Here's how:

1. Configure production environment: [Link to guide]
2. Set up scheduled jobs: [Link to guide]
3. Configure alerts: [Link to guide]

Need help? Schedule a call: [Link to calendar]

The Settler Team
```

---

## Onboarding Metrics

### Activation Metrics

**Time to First Value:**

- Target: <24 hours
- Measurement: Time from signup to first successful reconciliation
- Tracking: Analytics dashboard

**Activation Rate:**

- Target: 60%+
- Measurement: % of users who create first job within 7 days
- Tracking: Analytics dashboard

**Engagement Rate:**

- Target: 80%+
- Measurement: % of users who run reconciliations weekly
- Tracking: Analytics dashboard

### Satisfaction Metrics

**Customer Satisfaction:**

- Target: NPS >50
- Measurement: Net Promoter Score survey
- Tracking: Post-onboarding survey (Day 7)

**Support Tickets:**

- Target: <5% of users
- Measurement: % of users who open support tickets
- Tracking: Support dashboard

**Documentation Usage:**

- Target: 80%+ of users
- Measurement: % of users who access documentation
- Tracking: Analytics dashboard

---

## Onboarding Optimization

### A/B Testing

**Test Variables:**

- Welcome email content
- Onboarding flow (guided vs. self-service)
- Documentation format (video vs. text)
- Support channel (email vs. chat)

**Metrics to Track:**

- Time to first value
- Activation rate
- Engagement rate
- Customer satisfaction

### Feedback Loops

**Feedback Collection:**

- Post-onboarding survey (Day 7)
- In-app feedback widget
- Support ticket analysis
- User interviews

**Feedback Implementation:**

- Weekly review of feedback
- Monthly optimization sprints
- Quarterly onboarding improvements

---

## Troubleshooting

### Common Issues

**Issue 1: API Key Not Working**

- Solution: Verify API key is correct, check permissions
- Documentation: [API Key Setup](https://docs.settler.io/api-keys)

**Issue 2: Adapter Connection Failed**

- Solution: Verify adapter credentials, check API permissions
- Documentation: [Adapter Setup](https://docs.settler.io/adapters)

**Issue 3: Reconciliation Errors**

- Solution: Check matching rules, validate data format
- Documentation: [Error Handling](https://docs.settler.io/error-handling)

**Issue 4: Low Accuracy**

- Solution: Review matching rules, adjust tolerance
- Documentation: [Best Practices](https://docs.settler.io/best-practices)

### Support Escalation

**Level 1: Self-Service**

- Documentation
- Community (Discord, GitHub)
- Knowledge base

**Level 2: Email Support**

- Email: [support@settler.io](mailto:support@settler.io)
- Response time: 24 hours (Standard), 4 hours (Growth+)

**Level 3: Priority Support**

- Slack channel (Enterprise)
- Phone support (Enterprise)
- Dedicated account manager (Enterprise)

---

## Next Steps

### After Onboarding

1. **Optimize Configuration**
   - Fine-tune matching rules
   - Adjust tolerance levels
   - Configure advanced features

2. **Scale Usage**
   - Add more adapters
   - Increase reconciliation volume
   - Set up additional jobs

3. **Team Collaboration**
   - Invite team members
   - Set up role-based access
   - Configure team workflows

4. **Advanced Features**
   - Set up webhooks
   - Configure scheduled jobs
   - Enable advanced matching rules

---

**Last Updated:** January 2026
