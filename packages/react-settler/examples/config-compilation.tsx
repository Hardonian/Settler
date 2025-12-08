/**
 * Config Compilation Example
 * 
 * Demonstrates compiling React component trees into JSON configuration.
 */

import React from 'react';
import {
  ReconciliationDashboard,
  RuleSet,
  MatchRule,
  compileToConfig,
  compileToJSON
} from '@settler/react-settler';

export function ConfigCompilationExample() {
  // Define a reconciliation workflow using React components
  const workflow = (
    <ReconciliationDashboard>
      <RuleSet
        id="ecommerce-rules"
        name="E-commerce Reconciliation Rules"
        priority="exact-first"
        conflictResolution="manual-review"
      >
        <MatchRule
          id="rule-amount-exact"
          name="Exact Amount Match"
          field="amount"
          type="exact"
          priority={1}
        />
        <MatchRule
          id="rule-date-range"
          name="Date Range Match (±3 days)"
          field="date"
          type="range"
          tolerance={{ days: 3 }}
          priority={2}
        />
        <MatchRule
          id="rule-fuzzy-amount"
          name="Fuzzy Amount Match (0.5% tolerance)"
          field="amount"
          type="fuzzy"
          tolerance={{ percentage: 0.005, threshold: 0.98 }}
          priority={3}
        />
      </RuleSet>
    </ReconciliationDashboard>
  );

  // Compile to config object
  const config = compileToConfig(workflow, {
    name: 'E-commerce Payment Reconciliation',
    description: 'Reconciliation workflow for Stripe and PayPal payments'
  });

  // Compile to JSON string
  const jsonConfig = compileToJSON(workflow, {
    name: 'E-commerce Payment Reconciliation',
    description: 'Reconciliation workflow for Stripe and PayPal payments',
    pretty: true
  });

  // Log results
  console.log('Compiled Config:', config);
  console.log('JSON Config:', jsonConfig);

  return (
    <div>
      <h2>Config Compilation</h2>
      <p>Check the console for compiled configuration.</p>
      <pre style={{ background: '#f5f5f5', padding: '1rem', overflow: 'auto' }}>
        {jsonConfig}
      </pre>
    </div>
  );
}
