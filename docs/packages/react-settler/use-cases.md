# React.Settler Use Cases

## E-commerce Platform Reconciliation

### Problem
An e-commerce platform processes payments through Stripe, PayPal, and Square. They need to reconcile these payments with bank deposits daily, but manual reconciliation is time-consuming and error-prone.

### Solution
Use React.Settler to define reconciliation rules declaratively:

```tsx
<ReconciliationDashboard>
  <RuleSet id="ecommerce-rules" name="E-commerce Payment Matching">
    <MatchRule
      id="stripe-exact"
      name="Stripe Exact Match"
      field="amount"
      type="exact"
      priority={1}
    />
    <MatchRule
      id="date-range"
      name="Settlement Date Range"
      field="date"
      type="range"
      tolerance={{ days: 3 }}
      priority={2}
    />
  </RuleSet>
  
  <TransactionTable transactions={stripeTransactions} />
  <ExceptionTable exceptions={exceptions} />
</ReconciliationDashboard>
```

### Benefits
- Automated daily reconciliation
- Exception handling for mismatches
- Customizable dashboard for operations team
- JSON config works with any backend

## SaaS Subscription Reconciliation

### Problem
A SaaS company needs to match Stripe subscription payments with QuickBooks entries, handling prorations, refunds, and upgrades.

### Solution
Define complex matching rules using React components:

```tsx
<RuleSet id="saas-rules" name="Subscription Reconciliation">
  <MatchRule
    id="subscription-id"
    name="Match by Subscription ID"
    field="referenceId"
    type="exact"
    priority={1}
  />
  <MatchRule
    id="fuzzy-amount"
    name="Fuzzy Amount Match (handles prorations)"
    field="amount"
    type="fuzzy"
    tolerance={{ percentage: 0.05, threshold: 0.95 }}
    priority={2}
  />
</RuleSet>
```

### Benefits
- Handles complex subscription scenarios
- Proration tolerance for partial periods
- Custom rules for refunds and upgrades
- Integrates with existing accounting systems

## Marketplace Payout Reconciliation

### Problem
A marketplace needs to reconcile individual seller payouts with aggregated Stripe transfers, handling fees and splits.

### Solution
Build a custom reconciliation dashboard:

```tsx
<ReconciliationDashboard>
  <MetricCard title="Total Payouts" value={payouts.length} />
  <MetricCard title="Match Rate" value="98%" trend="up" />
  
  <RuleSet id="marketplace-rules">
    <MatchRule
      id="seller-id-match"
      name="Match by Seller ID"
      field="referenceId"
      type="regex"
      priority={1}
    />
    <MatchRule
      id="aggregated-amount"
      name="Match Aggregated Amounts"
      field="amount"
      type="fuzzy"
      tolerance={{ percentage: 0.01 }}
      priority={2}
    />
  </RuleSet>
  
  <ExceptionTable exceptions={exceptions} onResolve={handleResolve} />
</ReconciliationDashboard>
```

### Benefits
- Handles complex many-to-many matching
- Fee calculation and verification
- Exception queue for manual review
- Real-time dashboard for operations

## Multi-Currency Reconciliation

### Problem
A global platform processes payments in multiple currencies and needs to reconcile with FX conversions.

### Solution
Define rules that account for currency differences:

```tsx
<RuleSet id="multi-currency-rules">
  <MatchRule
    id="currency-match"
    name="Match Currency"
    field="currency"
    type="exact"
    priority={1}
  />
  <MatchRule
    id="fx-amount"
    name="FX Converted Amount"
    field="amount"
    type="fuzzy"
    tolerance={{ percentage: 0.02 }}
    priority={2}
  />
</RuleSet>
```

### Benefits
- Handles FX rate fluctuations
- Tolerance for conversion differences
- Multi-currency dashboard views
- Configurable FX tolerance

## Custom Reconciliation Backend

### Problem
A company wants to use React.Settler's UI components but has their own reconciliation engine.

### Solution
Compile React components to JSON and consume with custom backend:

```tsx
import { compileToJSON } from '@settler/react-settler';

const workflow = (
  <ReconciliationDashboard>
    <RuleSet id="custom-rules">
      <MatchRule id="rule-1" name="Custom Rule" field="amount" type="exact" />
    </RuleSet>
  </ReconciliationDashboard>
);

const jsonConfig = compileToJSON(workflow);
// Send jsonConfig to your custom backend
```

### Benefits
- Use React.Settler UI components
- Integrate with existing backend
- Protocol-agnostic JSON config
- No vendor lock-in
