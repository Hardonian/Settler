export type ColumnRole =
  | "transaction_id"
  | "date"
  | "amount"
  | "currency"
  | "fee"
  | "counterparty"
  | "descriptor"
  | "status"
  | "unknown";

export interface DiscoveredColumn {
  index: number;
  originalHeader: string;
  inferredRole: ColumnRole;
  confidence: number; // 0.00 to 1.00
  sampleValues: string[];
}

export interface DiscoveredSchema {
  delimiter: "," | "\t" | ";" | "|";
  hasHeader: boolean;
  totalRowsSampled: number;
  columns: DiscoveredColumn[];
  suggestedMapping: {
    transactionIdIndex: number;
    dateIndex: number;
    amountIndex: number;
    currencyIndex?: number;
    feeIndex?: number;
    descriptorIndex?: number;
  };
  detectedCurrency: string;
}

/**
 * Autonomous Zero-Shot Schema Discovery Engine (#61)
 * Analyzes unformatted CSV/TSV/delimited financial files and identifies column mappings,
 * dates, currencies, and integer amounts in sub-50ms deterministic execution.
 */
export class ZeroShotSchemaDiscovery {
  private readonly ISO_CURRENCIES = new Set([
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "CAD",
    "AUD",
    "CHF",
    "CNY",
    "SEK",
    "NZD",
    "SGD",
    "HKD",
    "NOK",
  ]);

  public discover(rawText: string): DiscoveredSchema {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      throw new Error("Cannot discover schema on empty input");
    }

    const delimiter = this.detectDelimiter(lines.slice(0, 10));
    const rawMatrix = lines.slice(0, 100).map((line) => this.splitLine(line, delimiter));

    const headerCandidate = rawMatrix[0]!;
    const hasHeader = this.checkHasHeader(headerCandidate, rawMatrix.slice(1));

    const headerNames = hasHeader
      ? headerCandidate
      : headerCandidate.map((_, i) => `Column_${i + 1}`);

    const dataRows = hasHeader ? rawMatrix.slice(1) : rawMatrix;
    const colCount = Math.max(...rawMatrix.map((r) => r.length));

    const discoveredCols: DiscoveredColumn[] = [];

    for (let colIdx = 0; colIdx < colCount; colIdx++) {
      const headerName = headerNames[colIdx] || `Col_${colIdx}`;
      const samples = dataRows.map((r) => r[colIdx] || "").filter((val) => val.trim().length > 0);

      const { role, confidence } = this.inferColumnRole(headerName, samples);

      discoveredCols.push({
        index: colIdx,
        originalHeader: headerName,
        inferredRole: role,
        confidence,
        sampleValues: samples.slice(0, 3),
      });
    }

    // Identify primary indices
    const dateCol = discoveredCols.find((c) => c.inferredRole === "date") ?? discoveredCols[0]!;
    const amountCol = discoveredCols.find((c) => c.inferredRole === "amount") ?? discoveredCols[1]!;
    const idCol =
      discoveredCols.find((c) => c.inferredRole === "transaction_id") ??
      discoveredCols.find((c) => c !== dateCol && c !== amountCol) ??
      discoveredCols[0]!;

    const currCol = discoveredCols.find((c) => c.inferredRole === "currency");
    const feeCol = discoveredCols.find((c) => c.inferredRole === "fee");
    const descCol = discoveredCols.find(
      (c) => c.inferredRole === "descriptor" || c.inferredRole === "counterparty"
    );

    // Infer global currency
    let detectedCurrency = "USD";
    if (currCol && currCol.sampleValues.length > 0) {
      const sample = currCol.sampleValues[0]!.toUpperCase().replace(/[^A-Z]/g, "");
      if (this.ISO_CURRENCIES.has(sample)) {
        detectedCurrency = sample;
      }
    }

    return {
      delimiter,
      hasHeader,
      totalRowsSampled: dataRows.length,
      columns: discoveredCols,
      suggestedMapping: {
        transactionIdIndex: idCol.index,
        dateIndex: dateCol.index,
        amountIndex: amountCol.index,
        currencyIndex: currCol?.index,
        feeIndex: feeCol?.index,
        descriptorIndex: descCol?.index,
      },
      detectedCurrency,
    };
  }

  private detectDelimiter(sampleLines: string[]): "," | "\t" | ";" | "|" {
    const candidates: Array<"," | "\t" | ";" | "|"> = [",", "\t", ";", "|"];
    const scores = candidates.map((delim) => {
      const counts = sampleLines.map((line) => line.split(delim).length);
      const isConsistent = counts.every((c) => c === counts[0] && c > 1);
      return { delim, score: isConsistent ? counts[0]! * 10 : 0 };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.score && scores[0].score > 0 ? scores[0].delim : ",";
  }

  private splitLine(line: string, delimiter: string): string[] {
    const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^${delimiter}]*))`, "g");
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(line)) !== null) {
      matches.push((match[1] ?? match[2] ?? "").trim());
    }
    return matches;
  }

  private checkHasHeader(candidate: string[], bodyRows: string[][]): boolean {
    const hasAlpha = candidate.every((c) => /[a-zA-Z]/.test(c));
    const firstBody = bodyRows[0];
    if (!firstBody) return hasAlpha;

    const bodyHasDigitsOrDates = firstBody.some((cell) => /\d/.test(cell));
    return hasAlpha && bodyHasDigitsOrDates;
  }

  private inferColumnRole(
    header: string,
    samples: string[]
  ): { role: ColumnRole; confidence: number } {
    const h = header.toLowerCase();

    // Direct header heuristics
    if (/(?:txn|tx|id|reference|ref|uuid|identifier|ch_|pi_|po_)/i.test(h)) {
      return { role: "transaction_id", confidence: 0.95 };
    }
    if (/(?:date|time|timestamp|created|cleared|posted)/i.test(h)) {
      return { role: "date", confidence: 0.95 };
    }
    if (/(?:fee|charge|commission|mdr|interchange)/i.test(h)) {
      return { role: "fee", confidence: 0.92 };
    }
    if (/(?:amount|gross|net|total|balance|credit|debit)/i.test(h)) {
      return { role: "amount", confidence: 0.94 };
    }
    if (/(?:currency|curr|iso)/i.test(h)) {
      return { role: "currency", confidence: 0.96 };
    }
    if (/(?:desc|narrative|memo|merchant|customer|partner|payee|name)/i.test(h)) {
      return { role: "descriptor", confidence: 0.88 };
    }
    if (/(?:status|state|disposition)/i.test(h)) {
      return { role: "status", confidence: 0.9 };
    }

    // Sample-based fallback heuristics
    if (samples.length > 0) {
      // Transaction reference ID check (e.g. PO_991823, tx_123, alphanumeric reference codes)
      if (
        samples.every((s) =>
          /^(?:po_|pi_|ch_|tx_|txn_|[a-z]{2,}[0-9]+|[0-9]{6,}|ref-)/i.test(s.trim())
        )
      ) {
        return { role: "transaction_id", confidence: 0.88 };
      }
      // Date check
      if (samples.every((s) => !isNaN(Date.parse(s)) && /\d{2,4}/.test(s))) {
        return { role: "date", confidence: 0.85 };
      }
      // Currency check
      if (samples.every((s) => this.ISO_CURRENCIES.has(s.toUpperCase().trim()))) {
        return { role: "currency", confidence: 0.9 };
      }
      // Amount check ($ / digits with decimal)
      if (
        samples.every((s) => /^[\$€£]?\s*-?\d+(?:\.\d{1,4})?$/.test(s.replace(/,/g, "").trim()))
      ) {
        return { role: "amount", confidence: 0.82 };
      }
    }

    return { role: "unknown", confidence: 0.3 };
  }
}
