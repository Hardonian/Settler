import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { NormalizedRecord, RecordDirection, RecordType } from '../packages/api/src/services/recon-core/normalized-types';

const DEMO_DIR = path.join(process.cwd(), 'demo/data');
if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
}

const START_DATE = new Date('2025-01-01T00:00:00Z');
const DAYS = 30;

function randomDate(start: Date, days: number) {
  const date = new Date(start);
  date.setDate(date.getDate() + Math.floor(Math.random() * days));
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return date;
}

function generateDataset() {
  const stripeRecords: NormalizedRecord[] = [];
  const bankRecords: NormalizedRecord[] = [];
  const expectedMatches: Array<{ stripeId: string; bankId: string; type: string }> = [];

  // 1. Generate Charges (incoming to Stripe)
  for (let i = 0; i < 50; i++) {
    const amount = Number((Math.random() * 100 + 10).toFixed(2));
    const fee = Number((amount * 0.029 + 0.30).toFixed(2));
    const net = Number((amount - fee).toFixed(2));
    const date = randomDate(START_DATE, DAYS);
    const orderId = `ord_${Math.floor(Math.random() * 10000)}`;
    const payoutId = `po_${Math.floor(i / 10)}`; // Group 10 charges per payout

    const stripeCharge: NormalizedRecord = {
      id: uuidv4(),
      externalId: `ch_${uuidv4().substring(0, 8)}`,
      source: 'Stripe',
      occurredAt: date,
      amount: amount,
      currency: 'USD',
      direction: RecordDirection.INCOMING,
      type: RecordType.CHARGE,
      status: 'succeeded',
      orderId: orderId,
      payoutId: payoutId,
      feeAmount: fee,
      netAmount: net,
      description: `Charge for ${orderId}`,
      raw: { id: 'raw_stripe' }
    };
    stripeRecords.push(stripeCharge);
  }

  // 2. Generate Payouts (outgoing from Stripe, incoming to Bank)
  // Group by payoutId
  const payouts = new Map<string, { amount: number, fee: number, date: Date, count: number }>();
  
  stripeRecords.forEach(r => {
    if (r.payoutId) {
      const p = payouts.get(r.payoutId) || { amount: 0, fee: 0, date: r.occurredAt, count: 0 };
      p.amount += r.amount;
      p.fee += (r.feeAmount || 0);
      p.count++;
      // Payout happens 2 days after the latest charge in the batch
      if (r.occurredAt > p.date) p.date = r.occurredAt;
      payouts.set(r.payoutId, p);
    }
  });

  payouts.forEach((data, payoutId) => {
    const payoutDate = new Date(data.date);
    payoutDate.setDate(payoutDate.getDate() + 2); // T+2 payout

    const netAmount = Number((data.amount - data.fee).toFixed(2));

    // Stripe Payout Record
    const stripePayout: NormalizedRecord = {
      id: uuidv4(),
      externalId: payoutId,
      source: 'Stripe',
      occurredAt: payoutDate,
      amount: netAmount,
      currency: 'USD',
      direction: RecordDirection.OUTGOING,
      type: RecordType.PAYOUT,
      status: 'paid',
      description: `Payout ${payoutId}`,
      raw: { id: 'raw_payout' }
    };
    stripeRecords.push(stripePayout);

    // Bank Deposit Record (Matches Stripe Payout)
    const bankDeposit: NormalizedRecord = {
      id: uuidv4(),
      externalId: `txn_${uuidv4().substring(0, 8)}`,
      source: 'Bank',
      occurredAt: payoutDate, // Same day
      amount: netAmount,
      currency: 'USD',
      direction: RecordDirection.INCOMING,
      type: RecordType.TRANSFER,
      status: 'posted',
      description: `STRIPE TRANSFER ${payoutId}`,
      raw: { id: 'raw_bank' }
    };
    bankRecords.push(bankDeposit);

    expectedMatches.push({ stripeId: stripePayout.id, bankId: bankDeposit.id, type: 'PAYOUT_MATCH' });
  });

  // 3. Generate some Unmatched Records (Anomalies)
  
  // A. Stripe Charge missing in Bank (not possible usually, but maybe missing payout)
  // B. Bank Fee not in Stripe
  bankRecords.push({
    id: uuidv4(),
    externalId: `txn_fee_${uuidv4().substring(0, 8)}`,
    source: 'Bank',
    occurredAt: randomDate(START_DATE, DAYS),
    amount: 15.00,
    currency: 'USD',
    direction: RecordDirection.OUTGOING,
    type: RecordType.FEE,
    status: 'posted',
    description: 'MONTHLY SERVICE FEE',
    raw: {}
  });

  // C. Stripe Refund
  const refundAmount = 50.00;
  stripeRecords.push({
    id: uuidv4(),
    externalId: `re_${uuidv4().substring(0, 8)}`,
    source: 'Stripe',
    occurredAt: randomDate(START_DATE, DAYS),
    amount: refundAmount,
    currency: 'USD',
    direction: RecordDirection.OUTGOING,
    type: RecordType.REFUND,
    status: 'succeeded',
    description: 'Refund for item',
    raw: {}
  });

  // Write to files
  fs.writeFileSync(path.join(DEMO_DIR, 'stripe_normalized.json'), JSON.stringify(stripeRecords, null, 2));
  fs.writeFileSync(path.join(DEMO_DIR, 'bank_normalized.json'), JSON.stringify(bankRecords, null, 2));
  fs.writeFileSync(path.join(DEMO_DIR, 'expected_matches.json'), JSON.stringify(expectedMatches, null, 2));

  console.log(`Generated ${stripeRecords.length} Stripe records and ${bankRecords.length} Bank records.`);
}

generateDataset();
