# Billing, Pricing, and Support Validation

**Complete billing QA plan, Stripe integration guide, invoice templates, and support playbooks**

---

## Table of Contents

1. [Billing QA Plan](#billing-qa-plan)
2. [Stripe Migration Guide](#stripe-migration-guide)
3. [Invoice & Refund Templates](#invoice--refund-templates)
4. [Support Playbooks](#support-playbooks)

---

## Billing QA Plan

### Test Case Flows

#### Test Case 1: Signup & Subscription Creation

**Steps:**
1. User signs up for free account
2. User upgrades to Starter plan ($29/mo)
3. Verify subscription created in Stripe
4. Verify user tier updated in database
5. Verify access to Starter features

**Expected Results:**
- ✅ Subscription created in Stripe
- ✅ User tier = "starter" in database
- ✅ User can create 5 jobs (Starter limit)
- ✅ Billing email sent

**Test Data:**
```json
{
  "email": "test@example.com",
  "plan": "starter",
  "price": 29.00,
  "currency": "usd"
}
```

---

#### Test Case 2: Upgrade Flow

**Steps:**
1. User on Starter plan ($29/mo)
2. User upgrades to Growth plan ($99/mo)
3. Verify prorated charge calculated
4. Verify subscription updated in Stripe
5. Verify user tier updated
6. Verify access to Growth features

**Expected Results:**
- ✅ Prorated charge = $70 (difference) * (days remaining / 30)
- ✅ Subscription updated in Stripe
- ✅ User tier = "growth"
- ✅ User can create 20 jobs (Growth limit)
- ✅ Upgrade email sent

**Test Data:**
```json
{
  "fromPlan": "starter",
  "toPlan": "growth",
  "currentPrice": 29.00,
  "newPrice": 99.00,
  "billingDate": "2026-01-15"
}
```

---

#### Test Case 3: Downgrade Flow

**Steps:**
1. User on Growth plan ($99/mo)
2. User downgrades to Starter plan ($29/mo)
3. Verify downgrade scheduled for next billing cycle
4. Verify user keeps Growth features until cycle ends
5. Verify refund NOT issued (downgrade at cycle end)

**Expected Results:**
- ✅ Downgrade scheduled for next billing date
- ✅ User keeps Growth features until cycle ends
- ✅ No immediate refund
- ✅ Downgrade email sent

**Test Data:**
```json
{
  "fromPlan": "growth",
  "toPlan": "starter",
  "currentPrice": 99.00,
  "newPrice": 29.00,
  "billingDate": "2026-02-15"
}
```

---

#### Test Case 4: Refund Flow

**Steps:**
1. User requests refund for current month
2. Support processes refund
3. Verify refund created in Stripe
4. Verify subscription canceled or paused
5. Verify refund email sent

**Expected Results:**
- ✅ Refund created in Stripe
- ✅ Subscription canceled or paused
- ✅ User tier = "free" or "canceled"
- ✅ Refund email sent
- ✅ Refund appears in Stripe dashboard

**Test Data:**
```json
{
  "subscriptionId": "sub_123",
  "amount": 99.00,
  "reason": "customer_request",
  "refundType": "full"
}
```

---

#### Test Case 5: Failed Payment

**Steps:**
1. User's payment method fails
2. Stripe sends webhook for failed payment
3. Verify user notified (email)
4. Verify subscription paused (not canceled)
5. Verify access restricted after grace period

**Expected Results:**
- ✅ Payment failure email sent
- ✅ Subscription status = "past_due"
- ✅ User access restricted after 7 days
- ✅ Retry payment attempted (Stripe automatic)

**Test Data:**
```json
{
  "subscriptionId": "sub_123",
  "paymentIntentId": "pi_123",
  "failureReason": "card_declined",
  "retryDate": "2026-01-22"
}
```

---

#### Test Case 6: Usage-Based Billing

**Steps:**
1. User exceeds plan limits (e.g., 1,000 reconciliations on Starter)
2. Verify overage charges calculated
3. Verify invoice created for overage
4. Verify user notified

**Expected Results:**
- ✅ Overage charges calculated correctly
- ✅ Invoice created for overage
- ✅ User notified via email
- ✅ Usage tracked accurately

**Test Data:**
```json
{
  "plan": "starter",
  "limit": 1000,
  "usage": 1500,
  "overage": 500,
  "overagePrice": 0.10,
  "overageCharge": 50.00
}
```

---

### Billing Test Checklist

**Signup & Subscription:**
- [ ] Free signup works
- [ ] Paid plan signup works
- [ ] Subscription created in Stripe
- [ ] User tier updated in database
- [ ] Welcome email sent

**Upgrades:**
- [ ] Upgrade works
- [ ] Prorated charge calculated correctly
- [ ] Subscription updated in Stripe
- [ ] User tier updated
- [ ] Upgrade email sent

**Downgrades:**
- [ ] Downgrade scheduled correctly
- [ ] User keeps features until cycle ends
- [ ] No refund issued
- [ ] Downgrade email sent

**Refunds:**
- [ ] Refund processed correctly
- [ ] Refund created in Stripe
- [ ] Subscription canceled/paused
- [ ] Refund email sent

**Failed Payments:**
- [ ] Payment failure handled
- [ ] User notified
- [ ] Subscription paused (not canceled)
- [ ] Retry logic works

**Usage-Based:**
- [ ] Overage calculated correctly
- [ ] Invoice created for overage
- [ ] User notified
- [ ] Usage tracked accurately

---

## Stripe Migration Guide

### Step 1: Set Up Stripe Account

**Create Stripe Account:**
1. Sign up at [stripe.com](https://stripe.com)
2. Complete account verification
3. Get API keys (test and live)

**API Keys:**
```bash
# Test keys (for development)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Live keys (for production)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

### Step 2: Install Stripe SDK

```bash
npm install stripe
```

---

### Step 3: Create Products & Prices

**Create Products:**
```typescript
// scripts/create-stripe-products.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const products = [
  {
    name: 'Starter',
    description: 'Perfect for small businesses',
    prices: [
      { amount: 2900, currency: 'usd', interval: 'month' }, // $29/mo
    ],
  },
  {
    name: 'Growth',
    description: 'For growing businesses',
    prices: [
      { amount: 9900, currency: 'usd', interval: 'month' }, // $99/mo
    ],
  },
  {
    name: 'Scale',
    description: 'For large businesses',
    prices: [
      { amount: 29900, currency: 'usd', interval: 'month' }, // $299/mo
    ],
  },
];

for (const product of products) {
  const stripeProduct = await stripe.products.create({
    name: product.name,
    description: product.description,
  });

  for (const price of product.prices) {
    await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: price.amount,
      currency: price.currency,
      recurring: { interval: price.interval },
    });
  }
}
```

---

### Step 4: Implement Subscription Creation

```typescript
// packages/api/src/services/BillingService.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class BillingService {
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string>
  ) {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
    });

    return subscription;
  }

  async updateSubscription(
    subscriptionId: string,
    newPriceId: string
  ) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations', // Prorate charges
    });

    return updated;
  }

  async cancelSubscription(subscriptionId: string) {
    const subscription = await stripe.subscriptions.cancel(subscriptionId);
    return subscription;
  }
}
```

---

### Step 5: Set Up Webhooks

**Webhook Endpoint:**
```typescript
// packages/api/src/routes/webhooks/stripe.ts
import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = express.Router();

router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle events
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;
    
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;
    
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Update user tier in database
  await updateUserTier(subscription.metadata.userId, subscription.metadata.tier);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Notify user, pause subscription
  await notifyUser(invoice.customer as string, 'payment_failed');
  await pauseSubscription(invoice.subscription as string);
}

export default router;
```

**Webhook Secret:**
- Get from Stripe Dashboard → Webhooks → Add endpoint
- Use secret for webhook signature verification

---

### Step 6: Test Integration

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

**Test Webhooks:**
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/webhooks/stripe`
- Or use Stripe Dashboard → Webhooks → Send test webhook

---

## Invoice & Refund Templates

### Invoice Email Template

**Subject:** Your Settler Invoice - [Invoice Number]

**Body:**

```
Hi [Customer Name],

Your Settler invoice is ready.

INVOICE DETAILS
Invoice Number: [INV-123]
Date: [January 15, 2026]
Amount Due: $[99.00]

BREAKDOWN
Plan: Growth Plan
Period: January 15 - February 14, 2026
Amount: $99.00

PAYMENT
Payment Method: •••• [Last 4 digits]
Status: [Paid / Pending]

DOWNLOAD INVOICE
[Download PDF]

QUESTIONS?
If you have any questions about this invoice, please contact us:
- Email: billing@settler.io
- Support: support@settler.io

Thanks for using Settler!

Settler Team
```

---

### Refund Email Template

**Subject:** Refund Processed - [Refund Amount]

**Body:**

```
Hi [Customer Name],

We've processed your refund.

REFUND DETAILS
Refund Amount: $[99.00]
Refund Date: [January 15, 2026]
Refund ID: [re_1234567890]
Original Invoice: [INV-123]

PROCESSING TIME
Refunds typically appear in your account within 5-10 business days.

QUESTIONS?
If you have any questions about this refund, please contact us:
- Email: billing@settler.io
- Support: support@settler.io

We're sorry to see you go. If you'd like to share feedback, we'd love to hear from you.

Thanks,
Settler Team
```

---

## Support Playbooks

### Playbook 1: "I Was Overcharged!"

**Scenario:** Customer claims they were charged incorrectly.

**Steps:**

1. **Acknowledge & Investigate**
   - "I'm sorry to hear about the billing issue. Let me investigate this right away."
   - Check Stripe dashboard for charges
   - Check database for subscription history
   - Review invoice details

2. **Verify Charges**
   - Compare charges to plan pricing
   - Check for prorated charges (upgrades)
   - Check for overage charges
   - Verify payment method

3. **Explain Charges**
   - "I can see you were charged $[X] on [Date]. This includes:"
     - Base plan: $[X]
     - Prorated charge: $[X] (if applicable)
     - Overage: $[X] (if applicable)

4. **Resolution**
   - **If error:** Issue refund immediately
   - **If correct:** Explain charges clearly
   - **If unclear:** Escalate to billing team

**Email Template:**

```
Hi [Customer Name],

I've reviewed your billing and here's what I found:

CHARGES BREAKDOWN
- [Date]: $[X] - [Plan Name] subscription
- [Date]: $[X] - Prorated upgrade charge (if applicable)
- [Date]: $[X] - Overage charges (if applicable)

TOTAL: $[X]

[If error:]
I've issued a refund of $[X] to your original payment method. You should see it in 5-10 business days.

[If correct:]
These charges are correct based on your usage. If you'd like to review your usage, you can do so in your dashboard: [Link]

If you have any questions, please let me know.

Best,
[Support Agent Name]
```

---

### Playbook 2: Billing Dispute

**Scenario:** Customer disputes a charge.

**Steps:**

1. **Acknowledge**
   - "I understand your concern. Let me look into this."

2. **Investigate**
   - Check Stripe for charge details
   - Review subscription history
   - Check for any refunds/credits
   - Review customer communication history

3. **Gather Information**
   - When did the charge occur?
   - What was the customer expecting?
   - Was there a miscommunication?

4. **Resolution Options**
   - **Full refund:** If error on our part
   - **Partial refund:** If partial error
   - **Credit:** If we want to retain customer
   - **Explanation:** If charge is correct

5. **Document**
   - Document dispute in CRM
   - Note resolution
   - Update customer record

**Email Template:**

```
Hi [Customer Name],

I've reviewed your billing dispute and here's my finding:

[Finding]

RESOLUTION
[Resolution details]

[If refund:]
I've processed a refund of $[X]. You should see it in 5-10 business days.

[If credit:]
I've applied a credit of $[X] to your account. This will be applied to your next invoice.

[If explanation:]
After reviewing your account, the charges are correct. Here's why: [Explanation]

If you have any questions, please let me know.

Best,
[Support Agent Name]
```

---

### Playbook 3: Upgrade/Downgrade Issues

**Scenario:** Customer upgraded/downgraded but changes aren't reflected.

**Steps:**

1. **Verify Change**
   - Check Stripe for subscription status
   - Check database for user tier
   - Check for any errors in logs

2. **Check Timing**
   - **Upgrade:** Should be immediate
   - **Downgrade:** Should be at end of billing cycle

3. **Fix If Needed**
   - Update user tier manually if stuck
   - Re-sync Stripe subscription if needed
   - Verify access to features

4. **Notify Customer**
   - Confirm change is complete
   - Explain any delays
   - Provide next steps

**Email Template:**

```
Hi [Customer Name],

I've reviewed your [upgrade/downgrade] request and here's the status:

CURRENT STATUS
- Plan: [Current Plan]
- Tier: [Current Tier]
- Billing: $[X]/month

[If upgrade:]
Your upgrade is complete! You now have access to:
- [Feature 1]
- [Feature 2]
- [Feature 3]

[If downgrade:]
Your downgrade is scheduled for [Date] (end of current billing cycle). Until then, you'll continue to have access to [Current Plan] features.

If you have any questions, please let me know.

Best,
[Support Agent Name]
```

---

### Support Escalation Matrix

| Issue Type | Level 1 | Level 2 | Level 3 |
|------------|---------|---------|---------|
| **Billing Error** | Support Agent | Billing Manager | CFO |
| **Refund Request** | Support Agent | Billing Manager | CFO |
| **Payment Failure** | Support Agent | Billing Manager | - |
| **Subscription Issue** | Support Agent | Engineering | CTO |
| **Feature Access** | Support Agent | Product Manager | - |

**Response Times:**
- Level 1: 24 hours
- Level 2: 4 hours
- Level 3: 1 hour

---

## Next Steps & TO DOs

### Immediate Actions (This Week)

| Task | Owner | Time Estimate | Priority |
|------|-------|---------------|----------|
| Set up Stripe account | Operations | 2 hours | P0 |
| Create Stripe products/prices | Operations | 1 hour | P0 |
| Implement subscription creation | Engineering | 1 day | P0 |
| Set up webhook endpoint | Engineering | 4 hours | P0 |
| Create invoice templates | Operations | 2 hours | P1 |

### Short-Term (This Month)

| Task | Owner | Time Estimate | Priority |
|------|-------|---------------|----------|
| Test billing flows end-to-end | QA | 1 day | P0 |
| Create refund process | Operations | 4 hours | P1 |
| Train support team on billing | Operations | 2 hours | P1 |
| Set up billing monitoring | Engineering | 4 hours | P1 |

### Long-Term (This Quarter)

| Task | Owner | Time Estimate | Priority |
|------|-------|---------------|----------|
| Implement usage-based billing | Engineering | 1 week | P1 |
| Add billing dashboard | Engineering | 1 week | P2 |
| Create billing analytics | Engineering | 1 week | P2 |
| Set up automated invoicing | Engineering | 2 days | P2 |

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Ready for Implementation
