const crypto = require('node:crypto');

function normalize(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(normalize);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = normalize(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(normalize(value));
}

function stableHash(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

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
    "sourceTransactionId": "src_1",
    "targetTransactionId": "tgt_1",
    "matchType": "fuzzy",
    "confidence": 0.8,
    "amountDiff": 0,
    "dateDiff": 0,
    "matchReason": "Matched by amount (0.00 diff), date (0 days), no merchant match"
  },
  {
    "sourceTransactionId": "src_2",
    "targetTransactionId": "tgt_2",
    "matchType": "fuzzy",
    "confidence": 0.8,
    "amountDiff": 0,
    "dateDiff": 0,
    "matchReason": "Matched by amount (0.00 diff), date (0 days), no merchant match"
  }
];

console.log('INPUT_HASH:', stableHash(inputPayload));
console.log('RULE_HASH:', stableHash(rules));
console.log('OUTPUT_HASH:', stableHash(matches.sort((a,b) => a.sourceTransactionId.localeCompare(b.sourceTransactionId))));
