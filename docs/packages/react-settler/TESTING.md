# Testing Guide

React.Settler includes testing utilities to make testing reconciliation components easy.

## Setup

```tsx
import { render } from '@testing-library/react';
import {
  TestWrapper,
  createMockTransaction,
  createMockTransactions,
  createMockTelemetryProvider
} from '@settler/react-settler';
```

## Mock Data

Create mock transactions:

```tsx
import { createMockTransaction, createMockTransactions } from '@settler/react-settler';

// Single transaction
const transaction = createMockTransaction({
  amount: { value: 100, currency: 'USD' },
  provider: 'stripe'
});

// Multiple transactions
const transactions = createMockTransactions(10);
```

## Component Testing

Test components with TestWrapper:

```tsx
import { render } from '@testing-library/react';
import { TransactionTable, TestWrapper, createMockTransactions } from '@settler/react-settler';

test('renders transactions', () => {
  const transactions = createMockTransactions(5);
  
  const { getByText } = render(
    <TestWrapper>
      <TransactionTable transactions={transactions} />
    </TestWrapper>
  );
  
  expect(getByText(transactions[0].id)).toBeInTheDocument();
});
```

## Telemetry Testing

Mock telemetry provider:

```tsx
import { createMockTelemetryProvider, setTelemetryProvider } from '@settler/react-settler';

test('tracks events', () => {
  const mockTelemetry = createMockTelemetryProvider();
  setTelemetryProvider(mockTelemetry);
  
  // Render component and interact
  // ...
  
  const events = mockTelemetry.getEvents();
  expect(events).toHaveLength(1);
  expect(events[0].name).toBe('transaction.selected');
  
  mockTelemetry.clear();
});
```

## Config Mode Testing

Test config compilation:

```tsx
import { render } from '@testing-library/react';
import { ReconciliationDashboard, RuleSet, MatchRule, TestWrapper } from '@settler/react-settler';

test('compiles config', () => {
  const config = {};
  
  render(
    <TestWrapper mode="config" config={config}>
      <RuleSet id="rules-1" name="Test Rules">
        <MatchRule id="rule-1" name="Test Rule" field="amount" type="exact" />
      </RuleSet>
    </TestWrapper>
  );
  
  expect(config.rulesets).toHaveLength(1);
  expect(config.rulesets[0].rules).toHaveLength(1);
});
```

## Integration Testing

Test full workflows:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ReconciliationDashboard,
  TransactionTable,
  FilterBar,
  TestWrapper,
  createMockTransactions
} from '@settler/react-settler';

test('filters transactions', async () => {
  const transactions = createMockTransactions(10);
  const handleFilterChange = jest.fn();
  
  render(
    <TestWrapper>
      <ReconciliationDashboard>
        <FilterBar onFilterChange={handleFilterChange} />
        <TransactionTable transactions={transactions} />
      </ReconciliationDashboard>
    </TestWrapper>
  );
  
  const providerSelect = screen.getByLabelText(/provider/i);
  fireEvent.change(providerSelect, { target: { value: 'stripe' } });
  
  expect(handleFilterChange).toHaveBeenCalledWith(
    expect.objectContaining({ provider: ['stripe'] })
  );
});
```

## Best Practices

1. **Use Mock Data**: Always use `createMockTransaction` instead of manual objects
2. **Test Both Modes**: Test UI mode and config mode separately
3. **Isolate Tests**: Each test should be independent
4. **Clean Up**: Clear telemetry mocks between tests
5. **Test Edge Cases**: Empty arrays, null values, etc.
