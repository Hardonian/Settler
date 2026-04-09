# React.Settler Protocol Specification

**Version:** 1.0.0  
**Status:** Stable  
**License:** MIT

## Overview

The React.Settler Protocol is a framework-agnostic, typed protocol for defining reconciliation workflows declaratively. It enables developers to:

- Define reconciliation UIs and rules using React components
- Compile React component trees into JSON configuration
- Consume reconciliation configs with any backend reconciliation engine
- Decouple UI definition from matching engine implementation

## Core Principles

1. **Framework Agnostic**: Protocol types are pure TypeScript/JSON, not tied to React
2. **Backend Agnostic**: Configs can be consumed by any reconciliation backend
3. **Type Safe**: Full TypeScript support with strict typing
4. **Versioned**: Protocol versions ensure backward compatibility
5. **Extensible**: Widget and rule types can be extended without breaking changes

## Type System

### Core Entities

#### `ReconciliationTransaction`

Represents a transaction that needs to be reconciled.

```typescript
interface ReconciliationTransaction {
  id: string;
  provider: string;
  providerTransactionId: string;
  amount: Money;
  currency: string;
  date: string; // ISO 8601
  status: TransactionStatus;
  metadata?: Record<string, unknown>;
  referenceId?: string;
}
```

#### `ReconciliationSettlement`

Represents a settlement/payout that needs to be reconciled.

```typescript
interface ReconciliationSettlement {
  id: string;
  provider: string;
  providerSettlementId: string;
  amount: Money;
  currency: string;
  settlementDate: string; // ISO 8601
  expectedDate?: string;
  status: SettlementStatus;
  metadata?: Record<string, unknown>;
}
```

#### `ReconciliationException`

Represents an exception requiring manual review.

```typescript
interface ReconciliationException {
  id: string;
  category: ExceptionCategory;
  severity: ExceptionSeverity;
  description: string;
  transactionId?: string;
  settlementId?: string;
  resolutionStatus: ExceptionResolutionStatus;
  createdAt: string;
  resolvedAt?: string;
}
```

### Rule System

#### `ReconciliationRule`

Defines how transactions and settlements should be matched.

```typescript
interface ReconciliationRule {
  id: string;
  name: string;
  field: RuleField;
  type: RuleType; // 'exact' | 'fuzzy' | 'range' | 'regex'
  tolerance?: RuleTolerance;
  priority?: number;
  enabled?: boolean;
}
```

**Rule Types:**

- `exact`: Exact match required
- `fuzzy`: Fuzzy matching with threshold
- `range`: Match within tolerance range
- `regex`: Pattern-based matching

**Rule Fields:**

- `transactionId`, `amount`, `date`, `referenceId`
- `providerTransactionId`, `providerSettlementId`, `currency`

#### `ReconciliationRuleSet`

Collection of rules with conflict resolution strategy.

```typescript
interface ReconciliationRuleSet {
  id: string;
  name: string;
  rules: ReconciliationRule[];
  priority: RulePriority;
  conflictResolution?: ConflictResolution;
}
```

### View Configuration

#### `ReconciliationViewConfig`

Defines how reconciliation data should be displayed.

```typescript
interface ReconciliationViewConfig {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  layout?: LayoutConfig;
}
```

#### Widget Types

- `transaction-table`: Display transactions in a table
- `exception-table`: Display exceptions requiring review
- `metric-card`: Display key metrics (matched, unmatched, accuracy)
- `match-list`: Display successful matches
- `summary-stats`: Display summary statistics
- `rule-editor`: Edit reconciliation rules
- `filter-bar`: Filter and search controls

## JSON Config Schema

When React components are compiled, they produce a `ReconciliationConfig` JSON structure:

```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "My Reconciliation Workflow",
    "description": "E-commerce reconciliation",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "rulesets": [
    {
      "id": "ruleset-1",
      "name": "Primary Matching Rules",
      "rules": [
        {
          "id": "rule-1",
          "name": "Exact Amount Match",
          "field": "amount",
          "type": "exact",
          "priority": 1
        }
      ],
      "priority": "exact-first",
      "conflictResolution": "manual-review"
    }
  ],
  "views": [
    {
      "id": "view-1",
      "name": "Dashboard",
      "widgets": [
        {
          "id": "widget-1",
          "type": "metric-card",
          "title": "Match Rate",
          "position": { "row": 0, "col": 0, "width": 4 }
        }
      ]
    }
  ],
  "widgets": {}
}
```

## Compilation Process

1. **React Tree Traversal**: React components are rendered in "config mode"
2. **Widget Extraction**: Widget configurations are extracted from component props
3. **Rule Extraction**: Rule definitions are extracted from `<RuleSet>` and `<MatchRule>` components
4. **Config Assembly**: All extracted data is assembled into a `ReconciliationConfig`
5. **JSON Output**: Config is serialized to JSON for backend consumption

## Versioning

Protocol versions follow semantic versioning:

- **Major**: Breaking changes to types or schema
- **Minor**: New types or features (backward compatible)
- **Patch**: Bug fixes and clarifications

Current version: **1.0.0**

## Backend Integration

Any reconciliation backend can consume `ReconciliationConfig` JSON:

1. Load config from storage or API
2. Parse JSON into protocol types
3. Apply rulesets to matching logic
4. Render views using widget configurations
5. Execute reconciliation jobs using defined rules

## Examples

See the `@settler/react-settler` package for React component examples that compile to this protocol.

## Stability Guarantees

- **Type Stability**: Core entity types (`ReconciliationTransaction`, `ReconciliationSettlement`, etc.) are stable
- **Schema Stability**: JSON config schema is versioned and backward compatible within major versions
- **Extension Points**: New widget types and rule types can be added without breaking existing configs

## License

MIT License - See LICENSE file for details.
