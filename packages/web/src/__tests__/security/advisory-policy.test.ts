import {
  assertNoAutonomousFinancialAction,
  buildAdvisoryPolicyMetadata,
} from '@/lib/ai/advisory-policy';

describe('advisory policy controls', () => {
  it('blocks autonomous ledger mutation requests', () => {
    expect(() =>
      assertNoAutonomousFinancialAction({ requestedAction: 'mutate_ledger' })
    ).toThrow('Autonomous financial ledger mutations are prohibited');
  });

  it('attaches non-authoritative policy metadata and provenance', () => {
    const metadata = buildAdvisoryPolicyMetadata({ route: 'test', input: 'sample' });

    expect(metadata.nonAuthoritative).toBe(true);
    expect(metadata.requiresHumanApprovalForFinancialPosting).toBe(true);
    expect(metadata.allowLedgerMutation).toBe(false);
    expect(metadata.disclaimer).toMatch(/non-authoritative guidance/i);
    expect(metadata.provenance.inputFingerprint).toHaveLength(64);
  });
});
