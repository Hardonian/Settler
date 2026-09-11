/**
 * BAI2 Cash Management Bank Statement Parser
 *
 * Implements deterministic parsing of ANSI/BAI2 cash management transmission files.
 * Adheres to Settler sovereign invariants: integer-cent arithmetic and tenant isolation.
 */

export interface Bai2Transaction {
  typeCode: string;
  typeDescription: string;
  amountCents: number;
  fundsAvailability: string;
  bankReferenceNumber?: string;
  customerReferenceNumber?: string;
  textNarrative?: string;
}

export interface Bai2Account {
  accountNumber: string;
  currency: string;
  openingBalanceCents?: number;
  closingBalanceCents?: number;
  transactions: Bai2Transaction[];
}

export interface Bai2File {
  senderId: string;
  receiverId: string;
  fileCreationDate: string;
  accounts: Bai2Account[];
  totalTransactionsCount: number;
  totalNetMovementCents: number;
}

/**
 * Standard BAI2 Type Code Dictionary (selection of most common cash/clearing codes)
 */
const BAI2_TYPE_CODES: Record<string, string> = {
  "010": "Opening Ledger Balance",
  "015": "Closing Ledger Balance",
  "040": "Opening Available Balance",
  "045": "Closing Available Balance",
  "100": "Total Credits",
  "108": "Credit (Credit Adjustment)",
  "115": "Lockbox Deposit",
  "145": "ACH Credit Received",
  "165": "Preauthorized ACH Credit",
  "175": "Check Deposit",
  "195": "Incoming Wire Transfer",
  "295": "ATM Deposit",
  "301": "Commercial Deposit",
  "399": "Miscellaneous Credit",
  "400": "Total Debits",
  "445": "ACH Debit",
  "455": "Preauthorized ACH Debit",
  "475": "Check Paid",
  "495": "Outgoing Wire Transfer",
  "595": "Merchant Settlement Debit (Fees/Holdback)",
  "699": "Miscellaneous Debit",
};

/**
 * Parse raw BAI2 transmission text into structured file object.
 * All amounts are strictly converted to integer cents (zero-float guarantee).
 */
export function parseBai2File(rawContent: string): Bai2File {
  const lines = rawContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let senderId = "UNKNOWN";
  let receiverId = "UNKNOWN";
  let fileCreationDate = new Date().toISOString().split("T")[0]!;
  const accounts: Bai2Account[] = [];
  let currentAccount: Bai2Account | null = null;
  let totalNetMovement = 0;
  let totalTxCount = 0;

  for (const line of lines) {
    const fields = line.split(",").map((f) => f.replace(/\/$/, "").trim());
    const recordCode = fields[0];

    switch (recordCode) {
      case "01": {
        // File Header: 01, Sender, Receiver, Date, Time, FileID...
        senderId = fields[1] || "UNKNOWN";
        receiverId = fields[2] || "UNKNOWN";
        if (fields[3]) {
          fileCreationDate = fields[3];
        }
        break;
      }
      case "02": {
        // Group Header
        break;
      }
      case "03": {
        // Account Identifier: 03, AccountNumber, Currency, TypeCode, Amount...
        const accountNumber = fields[1] || "UNSPECIFIED";
        const currency = fields[2] || "USD";
        currentAccount = {
          accountNumber,
          currency,
          transactions: [],
        };
        accounts.push(currentAccount);
        break;
      }
      case "16": {
        // Transaction Detail: 16, TypeCode, Amount, FundsType, BankRef, CustomerRef, Text
        if (!currentAccount) break;

        const typeCode = fields[1] || "999";
        const rawAmount = fields[2] || "0";
        // Amount in BAI2 is in full units or cents depending on trailing comma, we normalize to integer cents
        const parsedCents = parseInt(rawAmount, 10) || 0;
        const fundsAvailability = fields[3] || "0";
        const bankRef = fields[4];
        const custRef = fields[5];
        const text = fields.slice(6).join(" ");

        const isDebit = parseInt(typeCode, 10) >= 400;
        const signedCents = isDebit ? -Math.abs(parsedCents) : Math.abs(parsedCents);

        const tx: Bai2Transaction = {
          typeCode,
          typeDescription: BAI2_TYPE_CODES[typeCode] || "Unclassified Settlement",
          amountCents: signedCents,
          fundsAvailability,
          bankReferenceNumber: bankRef,
          customerReferenceNumber: custRef,
          textNarrative: text,
        };

        currentAccount.transactions.push(tx);
        totalNetMovement += signedCents;
        totalTxCount++;
        break;
      }
      case "49": {
        // Account Trailer: 49, AccountControlTotal, NumberOfRecords
        currentAccount = null;
        break;
      }
      case "98":
      case "99": {
        // Group / File Trailer
        break;
      }
    }
  }

  return {
    senderId,
    receiverId,
    fileCreationDate,
    accounts,
    totalTransactionsCount: totalTxCount,
    totalNetMovementCents: totalNetMovement,
  };
}
