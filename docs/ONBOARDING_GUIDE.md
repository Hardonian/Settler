# Customer Onboarding Guide

**Last Updated:** 2025-01-20  
**Status:** Revenue Bootstrap - Active  
**Purpose:** Simple onboarding guide for customers

## Overview

This guide helps you get started with Settler in under 30 minutes. Follow these steps to run your first reconciliation and see value immediately.

**Philosophy:** First value in <7 days, ideally <30 minutes.

---

## Step 1: Sign Up (5 minutes)

### Create Account

1. Go to [settler.dev/signup](https://settler.dev/signup)
2. Enter your email and password
3. Verify your email (check inbox)
4. Sign in to your account

### Create Workspace

1. Enter your company name
2. Choose a workspace slug (e.g., `my-company`)
3. Click "Create Workspace"

**Done!** You're now signed up and ready to start.

---

## Step 2: Connect APIs (15 minutes)

### Connect Stripe

1. Go to Settings → Integrations → Stripe
2. Click "Connect Stripe"
3. Enter your Stripe API key (get from Stripe Dashboard)
4. Click "Save"

### Connect Shopify

1. Go to Settings → Integrations → Shopify
2. Click "Connect Shopify"
3. Enter your Shopify API credentials
4. Click "Save"

### Connect QuickBooks

1. Go to Settings → Integrations → QuickBooks
2. Click "Connect QuickBooks"
3. Authorize Settler to access QuickBooks
4. Click "Save"

**Note:** You need at least 2 APIs connected for reconciliation.

---

## Step 3: Create Reconciliation Job (5 minutes)

### Create Job

1. Go to Console → Reconciliations
2. Click "Create Reconciliation Job"
3. Select data sources (Stripe, Shopify, QuickBooks)
4. Configure matching rules (amount, date, reference)
5. Click "Create"

### Run Reconciliation

1. Click "Run" on your reconciliation job
2. Wait for completion (usually <5 minutes)
3. View results

**Done!** You've run your first reconciliation.

---

## Step 4: View Results (5 minutes)

### Review Results

1. Go to Console → Reconciliations → [Your Job]
2. View matched transactions (with confidence scores)
3. Review unmatched items (with reasons)
4. Export reconciliation report (PDF/CSV)

### Understand Value

- **Time Saved:** This would have taken [X] hours manually
- **Accuracy:** [Y]% match rate
- **Cost Savings:** $[Z]/month in labor costs

**Done!** You've seen value from Settler.

---

## Next Steps

### Run More Reconciliations

- Create additional reconciliation jobs
- Run reconciliations on schedule
- Explore other features (receipts, feature flags)

### Explore Features

- **Receipts API:** Parse receipts automatically
- **Feature Flags:** Manage feature rollouts
- **Analytics:** View usage and performance

### Get Help

- **Documentation:** [settler.dev/docs](https://settler.dev/docs)
- **Support:** support@settler.io
- **Community:** [Community Forum](https://community.settler.dev)

---

## Common Issues

### API Connection Fails

**Solution:**

- Verify API keys are correct
- Check API permissions
- See [API Setup Guide](link)

### No Sample Data

**Solution:**

- Export sample data from your systems
- Use demo data for testing
- Contact support for help

### Reconciliation Fails

**Solution:**

- Check data sources are connected
- Verify data format is correct
- Contact support for help

---

## Success Criteria

You've successfully onboarded when:

- ✅ Account created
- ✅ APIs connected (at least 2)
- ✅ First reconciliation run successfully
- ✅ Results viewed and understood
- ✅ Value realized (time saved, accuracy improved)

**Target:** Complete onboarding in <30 minutes, see value in <7 days.

---

## Related Documents

- `/docs/FIRST_VALUE_MILESTONE.md` - First value milestone
- `/docs/PILOT_PROGRAM.md` - Pilot program details
- `/kits/customer-success/PILOT_KICKOFF_AGENDA.md` - Pilot kickoff agenda
