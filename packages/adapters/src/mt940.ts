/**
 * SWIFT MT940 Customer Statement Parser
 *
 * Deterministic parser for standard SWIFT MT940 customer financial statement messages.
 * Enforces strict integer cents arithmetic, zero float drift, and RFC 6962 leaf hashing.
 */

import { createHash } from "node:crypto";

export interface Mt940Entry {
  valueDate: string;
  entryDate?: string;
  creditDebitIndicator: "CRDT" | "DBIT";
  amountCents: number;
  currency: string;
  transactionTypeCode: string;
  customerReference?: string;
  bankReference?: string;
  supplementaryDetails?: string;
  narrative?: string;
  leafHash: string;
}

export interface Mt940Statement {
  transactionReference: string;
  accountIdentification: string;
  statementNumber?: string;
  currency: string;
  openingBalanceCents: number;
  openingBalanceDate: string;
  closingBalanceCents: number;
  closingBalanceDate: string;
  entries: Mt940Entry[];
  totalCreditCents: number;
  totalDebitCents: number;
}

/**
 * Parses SWIFT decimal amount (e.g. "1250,50" or "1250.50") into exact integer cents.
 */
export function parseMt940Amount(raw: string): number {
  const normalized = raw.trim().replace(",", ".");
  const parts = normalized.split(".");
  const whole = parseInt(parts[0] || "0", 10);
  const fracStr = (parts[1] || "").padEnd(2, "0").slice(0, 2);
  const frac = parseInt(fracStr, 10);
  return whole * 100 + frac;
}

/**
 * Parse an MT940 statement text into structured statement objects.
 */
export function parseMt940(content: string): Mt940Statement[] {
  const statements: Mt940Statement[] = [];
  // Normalize line endings
  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split statements if multiple present (marked by -} or separate :20: headers)
  const rawStatements = normalized.split(/(?=(?:^|\n):20:)/).filter((s) => s.trim().length > 0);

  for (const block of rawStatements) {
    // Extract tags
    let transactionReference = "";
    let accountIdentification = "";
    let statementNumber = "";
    let currency = "USD";
    let openingBalanceCents = 0;
    let openingBalanceDate = "";
    let closingBalanceCents = 0;
    let closingBalanceDate = "";
    const entries: Mt940Entry[] = [];
    let totalCreditCents = 0;
    let totalDebitCents = 0;

    // Match tags: :20:, :25:, :28C:, :60F:, :61:, :86:, :62F:
    const tag20 = /:20:(.+)/.exec(block);
    if (tag20 && tag20[1]) {
      transactionReference = tag20[1].trim();
    }

    const tag25 = /:25:(.+)/.exec(block);
    if (tag25 && tag25[1]) {
      accountIdentification = tag25[1].trim();
    }

    const tag28C = /:28C:(.+)/.exec(block);
    if (tag28C && tag28C[1]) {
      statementNumber = tag28C[1].trim();
    }

    // :60F: or :60M: Opening Balance: (D|C)YYMMDDCCCAMOUNT
    const tag60 = /:60[FM]:([DC])(\d{6})([A-Z]{3})([0-9,\.]+)/.exec(block);
    if (tag60 && tag60[1] && tag60[2] && tag60[3] && tag60[4]) {
      const isCredit = tag60[1] === "C";
      openingBalanceDate = `20${tag60[2].slice(0, 2)}-${tag60[2].slice(2, 4)}-${tag60[2].slice(4, 6)}`;
      currency = tag60[3];
      const parsedAmount = parseMt940Amount(tag60[4]);
      openingBalanceCents = isCredit ? parsedAmount : -parsedAmount;
    }

    // :62F: or :62M: Closing Balance: (D|C)YYMMDDCCCAMOUNT
    const tag62 = /:62[FM]:([DC])(\d{6})([A-Z]{3})([0-9,\.]+)/.exec(block);
    if (tag62 && tag62[1] && tag62[2] && tag62[3] && tag62[4]) {
      const isCredit = tag62[1] === "C";
      closingBalanceDate = `20${tag62[2].slice(0, 2)}-${tag62[2].slice(2, 4)}-${tag62[2].slice(4, 6)}`;
      const parsedAmount = parseMt940Amount(tag62[4]);
      closingBalanceCents = isCredit ? parsedAmount : -parsedAmount;
    }

    // Extract :61: lines and optional subsequent :86:
    // Pattern: :61:(\d{6})(\d{4})?([A-Z]{1,2})([0-9,\.]+)([A-Z0-9]{4})([^/\n]+)?(\/\/[^\n]+)?
    const lines = block.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]?.trim() || "";
      if (line.startsWith(":61:")) {
        const payload = line.slice(4);
        // Regex for :61: fields:
        // YYMMDD (6 digits date), optional entry date (4 digits), (C|D|RC|RD), amount, transaction code (S|N|F...)
        const match61 = /^(\d{6})(\d{4})?([A-Z]{1,2})([0-9,\.]+)([A-Z0-9]{3,4})?(.*?)$/.exec(
          payload
        );
        if (match61 && match61[1] && match61[3] && match61[4]) {
          const valDate = `20${match61[1].slice(0, 2)}-${match61[1].slice(2, 4)}-${match61[1].slice(4, 6)}`;
          const cdCode = match61[3];
          const isCredit = cdCode === "C" || cdCode === "RC";
          const amountCents = parseMt940Amount(match61[4]);
          const txCode = match61[5] || "NTRF";
          const remainder = match61[6] || "";

          let customerReference: string | undefined;
          let bankReference: string | undefined;

          if (remainder.includes("//")) {
            const refParts = remainder.split("//");
            customerReference = refParts[0]?.trim() || undefined;
            bankReference = refParts[1]?.trim() || undefined;
          } else if (remainder.trim().length > 0) {
            customerReference = remainder.trim();
          }

          // Check if next line is :86: narrative
          let narrative: string | undefined;
          if (i + 1 < lines.length && lines[i + 1]?.startsWith(":86:")) {
            narrative = lines[i + 1]!.slice(4).trim();
            i++;
          }

          // Compute RFC 6962 leaf hash: SHA-256(0x00 || payload)
          const leafPreimage = Buffer.concat([
            Buffer.from([0x00]),
            Buffer.from(
              `${valDate}|${cdCode}|${amountCents}|${currency}|${customerReference ?? ""}|${bankReference ?? ""}`
            ),
          ]);
          const leafHash = createHash("sha256").update(leafPreimage).digest("hex");

          const entry: Mt940Entry = {
            valueDate: valDate,
            creditDebitIndicator: isCredit ? "CRDT" : "DBIT",
            amountCents,
            currency,
            transactionTypeCode: txCode,
            customerReference,
            bankReference,
            narrative,
            leafHash,
          };

          entries.push(entry);
          if (isCredit) {
            totalCreditCents += amountCents;
          } else {
            totalDebitCents += amountCents;
          }
        }
      }
    }

    if (transactionReference || entries.length > 0) {
      statements.push({
        transactionReference,
        accountIdentification,
        statementNumber,
        currency,
        openingBalanceCents,
        openingBalanceDate,
        closingBalanceCents,
        closingBalanceDate,
        entries,
        totalCreditCents,
        totalDebitCents,
      });
    }
  }

  return statements;
}
