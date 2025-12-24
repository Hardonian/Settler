# React.Settler Quick Start Guide

Get started with React.Settler in 5 minutes.

## Installation

```bash
npm install @settler/react-settler @settler/protocol
```

## Basic Usage

### 1. Render a Dashboard

```tsx
import {
  ReconciliationDashboard,
  TransactionTable,
  ExceptionTable,
  MetricCard
} from '@settler/react-settler';

function MyDashboard() {
  const transactions = [
    {
      id: 'tx-1',
      provider: 'stripe',
      providerTransactionId: 'ch_123',
      amount: { value: 100.00, currency: 'USD' },
      currency: 'USD',
      date: '2024-01-01T00:00:00Z',
      status: 'succeeded'
    }
  ];

  return (
    <ReconciliationDashboard>
      <MetricCard title="Transactions" value={transactions.length} />
      <TransactionTable transactions={transactions} />
    </ReconciliationDashboard>
  );
}
```

### 2. Define Rules

```tsx
import {
  ReconciliationDashboard,
  RuleSet,
  MatchRule
} from '@settler/react-settler';

function MyRules() {
  return (
    <ReconciliationDashboard>
      <RuleSet id="rules-1" name="Payment Matching">
        <MatchRule
          id="rule-1"
          name="Exact Amount Match"
          field="amount"
          type="exact"
        />
        <MatchRule
          id="rule-2"
          name="Date Range Match"
          field="date"
          type="range"
          tolerance={{ days: 7 }}
        />
      </RuleSet>
    </ReconciliationDashboard>
  );
}
```

### 3. Compile to JSON

```tsx
import { compileToJSON } from '@settler/react-settler';

const workflow = (
  <ReconciliationDashboard>
    <RuleSet id="rules-1" name="My Rules">
      <MatchRule id="rule-1" name="Amount Match" field="amount" type="exact" />
    </RuleSet>
  </ReconciliationDashboard>
);

const json = compileToJSON(workflow, { pretty: true });
console.log(json);
```

## Component Reference

### ReconciliationDashboard
Main wrapper component.

```tsx
<ReconciliationDashboard mode="ui" config={config}>
  {children}
</ReconciliationDashboard>
```

### TransactionTable
Display transactions.

```tsx
<TransactionTable
  transactions={transactions}
  onSelect={(tx) => console.log(tx)}
  showProvider={true}
  showStatus={true}
/>
```

### ExceptionTable
Display exceptions.

```tsx
<ExceptionTable
  exceptions={exceptions}
  onResolve={(exc) => console.log(exc)}
  showSeverity={true}
  showCategory={true}
/>
```

### MetricCard
Display metrics.

```tsx
<MetricCard
  title="Match Rate"
  value="95%"
  subtitle="19 of 20 matched"
  trend="up"
/>
```

### RuleSet
Container for rules.

```tsx
<RuleSet
  id="rules-1"
  name="My Rules"
  priority="exact-first"
  conflictResolution="manual-review"
>
  {children}
</RuleSet>
```

### MatchRule
Define a matching rule.

```tsx
<MatchRule
  id="rule-1"
  name="Amount Match"
  field="amount"
  type="exact"
  tolerance={{ amount: 0.01 }}
  priority={1}
  enabled={true}
/>
```

## Rule Types

- `exact` - Exact match required
- `fuzzy` - Fuzzy matching with threshold
- `range` - Match within tolerance range
- `regex` - Pattern-based matching

## Rule Fields

- `transactionId`
- `amount`
- `date`
- `referenceId`
- `providerTransactionId`
- `providerSettlementId`
- `currency`

## Examples

See `examples/` directory:
- `basic-dashboard.tsx` - Simple dashboard
- `rule-definition.tsx` - Rule definitions
- `config-compilation.tsx` - Config compilation

## Documentation

- [README.md](./README.md) - Full documentation
- [PROTOCOL.md](../protocol/PROTOCOL.md) - Protocol specification
- [Use Cases](./docs/use-cases.md) - Use case examples

## Support

- GitHub Issues: [github.com/settler/react-settler](https://github.com/settler/react-settler)
- Documentation: [docs.settler.dev/react-settler](https://docs.settler.dev/react-settler)
