import { stableHash } from './packages/protocol/src/utils';

const tenantId = 'tenant_ci_test';
const sourceTransactions = [
  {
    id: 'src_1',
    amount: 100.00,
    date: '2026-02-18T10:00:00.000Z',
    currency: 'USD'
  },
  {
    id: 'src_2',
    amount: 50.50,
    date: '2026-02-18T11:00:00.000Z',
    currency: 'USD'
  }
];

const targetTransactions = [
  {
    id: 'tgt_1',
    amount: 100.00,
    date: '2026-02-18T10:05:00.000Z',
    currency: 'USD'
  },
  {
    id: 'tgt_2',
    amount: 50.50,
    date: '2026-02-18T11:10:00.000Z',
    currency: 'USD'
  }
];

const inputPayload = {
  tenantId,
  sourceTransactions,
  targetTransactions
};

const rules = {
  amountTolerance: 0.01,
  dateWindowDays: 3,
  requireExactMerchant: false
};

const matches = [
  {
    sourceTransactionId: 'src_1',
    targetTransactionId: 'tgt_1',
    matchType: 'exact',
    confidence: 1.0,
    amountDiff: 0,
    dateDiff: 0,
    matchReason: 'Matched by amount (0.00 diff), date (0 days), no merchant match'
  },
  {
    sourceTransactionId: 'src_2',
    targetTransactionId: 'tgt_2',
    matchType: 'exact',
    confidence: 1.0,
    amountDiff: 0,
    dateDiff: 0,
    matchReason: 'Matched by amount (0.00 diff), date (0 days), no merchant match'
  }
];

console.log('INPUT_HASH:', stableHash(inputPayload));
console.log('RULE_HASH:', stableHash(rules));
console.log('OUTPUT_HASH:', stableHash(matches.sort((a,b) => a.sourceTransactionId.localeCompare(b.sourceTransactionId))));
