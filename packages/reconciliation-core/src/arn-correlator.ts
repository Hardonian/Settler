/**
 * Acquirer Reference Number (ARN) Correlator
 *
 * Deterministic 23-digit ARN validator, network metadata extractor, and clearing-to-gateway correlator.
 * Cites Visa/Mastercard clearing specifications to link settlement lines directly to gateway authorizations.
 */

export interface ParsedArn {
  arn: string;
  isValidLength: boolean;
  isValidChecksum: boolean;
  networkFamily: "visa" | "mastercard" | "discover" | "amex" | "unknown";
  acquirerBin: string;
  processingYear: number;
  julianDayOfYear: number;
  sequenceNumber: string;
  checkDigit: number;
}

export interface ArnCorrelationMatch<T = unknown> {
  arn: string;
  gatewayRecord: T;
  clearingRecord: T;
  isExactArnMatch: boolean;
  parsedMetadata: ParsedArn;
}

/**
 * Standard Luhn / Mod 10 checksum validator for credit card clearing identifiers.
 */
export function validateLuhnChecksum(digits: string): boolean {
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Parses and validates an Acquirer Reference Number.
 */
export function parseArn(rawArn: string): ParsedArn {
  const sanitized = rawArn.replace(/\D/g, "");
  const isValidLength = sanitized.length === 23;

  if (!isValidLength) {
    return {
      arn: sanitized,
      isValidLength: false,
      isValidChecksum: false,
      networkFamily: "unknown",
      acquirerBin: "",
      processingYear: 0,
      julianDayOfYear: 0,
      sequenceNumber: "",
      checkDigit: 0,
    };
  }

  // Digits 1-6: Acquirer BIN
  const acquirerBin = sanitized.substring(0, 6);
  // Digits 7-10: Julian date (YDDD)
  const julianDigitYear = parseInt(sanitized.charAt(6), 10);
  const currentDecadeYear = Math.floor(new Date().getFullYear() / 10) * 10 + julianDigitYear;
  const julianDay = parseInt(sanitized.substring(7, 10), 10);
  // Digits 11-22: Sequence
  const sequenceNumber = sanitized.substring(10, 22);
  // Digit 23: Check digit
  const checkDigit = parseInt(sanitized.charAt(22), 10);

  // Identify network family by BIN prefix
  let networkFamily: "visa" | "mastercard" | "discover" | "amex" | "unknown" = "unknown";
  const firstDigit = sanitized.charAt(0);
  if (firstDigit === "4") networkFamily = "visa";
  else if (firstDigit === "5" || firstDigit === "2") networkFamily = "mastercard";
  else if (firstDigit === "6") networkFamily = "discover";
  else if (firstDigit === "3") networkFamily = "amex";

  const isValidChecksum = validateLuhnChecksum(sanitized);

  return {
    arn: sanitized,
    isValidLength: true,
    isValidChecksum,
    networkFamily,
    acquirerBin,
    processingYear: currentDecadeYear,
    julianDayOfYear: julianDay,
    sequenceNumber,
    checkDigit,
  };
}

export class ArnCorrelator<T extends { arn?: string; id: string }> {
  private gatewayMap = new Map<string, T>();

  public registerGatewayRecords(records: T[]): void {
    for (const record of records) {
      if (record.arn) {
        const sanitized = record.arn.replace(/\D/g, "");
        if (sanitized.length === 23) {
          this.gatewayMap.set(sanitized, record);
        }
      }
    }
  }

  /**
   * Correlates a clearing statement row by ARN against registered gateway authorizations.
   */
  public correlateClearingRecord(clearingRecord: T): ArnCorrelationMatch<T> | null {
    if (!clearingRecord.arn) return null;
    const sanitized = clearingRecord.arn.replace(/\D/g, "");
    const parsed = parseArn(sanitized);

    if (!parsed.isValidLength) return null;

    const gatewayMatch = this.gatewayMap.get(sanitized);
    if (!gatewayMatch) return null;

    return {
      arn: sanitized,
      gatewayRecord: gatewayMatch,
      clearingRecord,
      isExactArnMatch: true,
      parsedMetadata: parsed,
    };
  }
}
