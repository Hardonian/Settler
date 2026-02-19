import { stableHash } from '@settler/protocol';
import { matchTransactions } from '../deterministic-matcher';

/**
 * Reconciliation Capsule Integrity Test
 *
 * This test acts as a CI guard to ensure the reconciliation engine
 * remains deterministic and produces stable proof capsules.
 */
describe('Reconciliation Proof Capsule Integrity', () => {
  const fixture = {
    tenantId: 'tenant_ci_test',
    sourceTransactions: [
      {
        id: 'src_1',
        amount: 100.00,
        date: new Date('2026-02-18T10:00:00Z'),
        description: 'Stripe Payout P1',
        currency: 'USD'
      },
      {
        id: 'src_2',
        amount: 50.50,
        date: new Date('2026-02-18T11:00:00Z'),
        description: 'Stripe Payout P2',
        currency: 'USD'
      }
    ],
    targetTransactions: [
      {
        id: 'tgt_1',
        amount: 100.00,
        date: new Date('2026-02-18T10:05:00Z'),
        description: 'Order #1001',
        currency: 'USD'
      },
      {
        id: 'tgt_2',
        amount: 50.50,
        date: new Date('2026-02-18T11:10:00Z'),
        description: 'Order #1002',
        currency: 'USD'
      }
    ],
    rules: {
      amountTolerance: 0.01,
      dateWindowDays: 3,
      requireExactMerchant: false
    }
  };

  // SNAPSHOTS: If these change, it means the hashing or matching logic has drifted.
  // These are derived from the current implementation.
  const SNAPSHOTS = {
    input: 'c28c86d8b02da42d7be834f8287413693fb57cc3b5c6e83893309a473855a901',
    rule: '809d0663484f23e2069796853229b114dbe7517a6c9e0750570b561848cc8122',
    output: '6594d935fca4667823e59074fa88f8303f56cebb4c70d9709a39775080e72bd5'
  };

  it('should produce a deterministic input hash', () => {
    const inputPayload = {
      tenantId: fixture.tenantId,
      sourceTransactions: fixture.sourceTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        date: t.date.toISOString(),
        currency: t.currency,
      })),
      targetTransactions: fixture.targetTransactions.map(t => ({
        id: t.id,
        amount: t.amount,
        date: t.date.toISOString(),
        currency: t.currency,
      })),
    };
    const currentInputHash = stableHash(inputPayload);
    expect(currentInputHash).toBe(SNAPSHOTS.input);
  });

  it('should produce a deterministic rule hash', () => {
    const currentRuleHash = stableHash(fixture.rules);
    expect(currentRuleHash).toBe(SNAPSHOTS.rule);
  });

  it('should produce a deterministic output hash matching the snapshot', () => {
    const matches = matchTransactions(
      fixture.sourceTransactions,
      fixture.targetTransactions,
      fixture.rules
    );

    // Ensure stable order before hashing
    const sortedMatches = [...matches].sort((a, b) =>
      a.sourceTransactionId.localeCompare(b.sourceTransactionId)
    );

    const currentOutputHash = stableHash(sortedMatches);
    expect(currentOutputHash).toBe(SNAPSHOTS.output);
  });
});
