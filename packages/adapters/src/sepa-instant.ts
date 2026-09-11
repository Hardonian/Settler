/**
 * SEPA Instant Credit Transfer (SCT Inst) Pipeline Connector
 *
 * Implements European Payments Council (EPC) Rulebook and ISO 20022 pacs.008 / pacs.002
 * real-time settlement message parsing and order reconciliation.
 * Enforces strict EUR currency, IBAN Mod-97 verification, and RFC 6962 SHA-256 Merkle leaf sealing.
 */

import { createHash } from "node:crypto";

export interface SepaInstantMessage {
  messageId: string;
  instructionId: string;
  endToEndId: string;
  debtorIban: string;
  debtorBic: string;
  debtorName: string;
  creditorIban: string;
  creditorBic: string;
  creditorName: string;
  amountCents: bigint;
  currency: "EUR";
  settlementTimestamp: string;
  status: "ACCP" | "RJCT" | "ACSP";
  remittanceInformation?: string;
  rawLeafHash?: string;
}

export interface SepaReconciliationResult {
  matchedCount: number;
  unmatchedOrdersCount: number;
  unmatchedTransfersCount: number;
  merkleBatchRoot: string;
  matchedPairs: Array<{
    orderId: string;
    endToEndId: string;
    amountCents: bigint;
    varianceCents: bigint;
  }>;
}

/**
 * Validates an International Bank Account Number (IBAN) using ISO 13616 Mod-97-10.
 */
export function validateIban(iban: string): boolean {
  const sanitized = iban.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (sanitized.length < 15 || sanitized.length > 34) return false;

  // Move first 4 characters to the end
  const rearranged = sanitized.slice(4) + sanitized.slice(0, 4);

  // Convert letters to numbers (A = 10, B = 11, ..., Z = 35)
  let numeric = "";
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      numeric += (code - 55).toString();
    } else {
      numeric += rearranged.charAt(i);
    }
  }

  // Large integer mod 97
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const chunk = remainder.toString() + numeric.substring(i, i + 7);
    remainder = parseInt(chunk, 10) % 97;
  }

  return remainder === 1;
}

/**
 * Parses XML or JSON payload representing ISO 20022 pacs.008 / pacs.002 SCT Inst message.
 */
export function parseSepaInstantMessage(raw: {
  msgId: string;
  instId: string;
  e2eId: string;
  dbtrIban: string;
  dbtrBic: string;
  dbtrNm: string;
  cdtrIban: string;
  cdtrBic: string;
  cdtrNm: string;
  amtEur: number | string;
  sttlmDt: string;
  txSts?: "ACCP" | "RJCT" | "ACSP";
  rmtInf?: string;
}): SepaInstantMessage {
  if (!validateIban(raw.dbtrIban)) {
    throw new Error(`Invalid Debtor IBAN: '${raw.dbtrIban}' failed ISO 13616 Mod-97`);
  }
  if (!validateIban(raw.cdtrIban)) {
    throw new Error(`Invalid Creditor IBAN: '${raw.cdtrIban}' failed ISO 13616 Mod-97`);
  }

  const amtNum = typeof raw.amtEur === "string" ? parseFloat(raw.amtEur) : raw.amtEur;
  if (isNaN(amtNum) || amtNum <= 0) {
    throw new Error(`Invalid SEPA settlement amount: '${raw.amtEur}'`);
  }
  const amountCents = BigInt(Math.round(amtNum * 100));

  const canonicalLeafData = `${raw.msgId}:${raw.e2eId}:${raw.dbtrIban}:${raw.cdtrIban}:${amountCents.toString()}:EUR:${raw.sttlmDt}`;
  const rawLeafHash = createHash("sha256")
    .update(Buffer.concat([Buffer.from([0x00]), Buffer.from(canonicalLeafData, "utf-8")]))
    .digest("hex");

  return {
    messageId: raw.msgId,
    instructionId: raw.instId,
    endToEndId: raw.e2eId,
    debtorIban: raw.dbtrIban,
    debtorBic: raw.dbtrBic,
    debtorName: raw.dbtrNm,
    creditorIban: raw.cdtrIban,
    creditorBic: raw.cdtrBic,
    creditorName: raw.cdtrNm,
    amountCents,
    currency: "EUR",
    settlementTimestamp: raw.sttlmDt,
    status: raw.txSts ?? "ACCP",
    remittanceInformation: raw.rmtInf,
    rawLeafHash,
  };
}

/**
 * Reconciles parsed SEPA Instant Credit Transfers against internal merchant orders.
 */
export function reconcileSepaInstantBatch(
  transfers: SepaInstantMessage[],
  orders: Array<{ orderId: string; referenceNumber: string; expectedAmountCents: bigint }>
): SepaReconciliationResult {
  const matchedPairs: Array<{
    orderId: string;
    endToEndId: string;
    amountCents: bigint;
    varianceCents: bigint;
  }> = [];

  const unmatchedTransfers: SepaInstantMessage[] = [];
  const unmatchedOrders = new Map(orders.map((o) => [o.referenceNumber, o]));

  for (const transfer of transfers) {
    // Attempt match by EndToEndId or Remittance info
    const key = transfer.endToEndId;
    const order =
      unmatchedOrders.get(key) ||
      (transfer.remittanceInformation
        ? unmatchedOrders.get(transfer.remittanceInformation)
        : undefined);

    if (order && order.expectedAmountCents === transfer.amountCents) {
      matchedPairs.push({
        orderId: order.orderId,
        endToEndId: transfer.endToEndId,
        amountCents: transfer.amountCents,
        varianceCents: 0n,
      });
      unmatchedOrders.delete(order.referenceNumber);
    } else {
      unmatchedTransfers.push(transfer);
    }
  }

  // Calculate batch Merkle root
  const leaves = transfers
    .map((t) => t.rawLeafHash || createHash("sha256").update(t.endToEndId).digest("hex"))
    .sort();

  let merkleBatchRoot = "0000000000000000000000000000000000000000000000000000000000000000";
  if (leaves.length > 0) {
    let currentLevel = leaves;
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i]!;
        const right = currentLevel[i + 1] ?? left;
        const combined = createHash("sha256")
          .update(Buffer.concat([Buffer.from([0x01]), Buffer.from(left + right, "hex")]))
          .digest("hex");
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }
    merkleBatchRoot = currentLevel[0]!;
  }

  return {
    matchedCount: matchedPairs.length,
    unmatchedOrdersCount: unmatchedOrders.size,
    unmatchedTransfersCount: unmatchedTransfers.length,
    merkleBatchRoot,
    matchedPairs,
  };
}
