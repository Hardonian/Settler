import { ArnCorrelator, parseArn, validateLuhnChecksum } from "./arn-correlator.js";

describe("Acquirer Reference Number (ARN) Correlator", () => {
  const SAMPLE_VISA_ARN = "40001262500000000000014"; // 23 digits, starts with 4 (Visa)

  it("validates Luhn checksum algorithm correctly", () => {
    // Valid Luhn strings
    expect(validateLuhnChecksum("79927398713")).toBe(true);
    // Invalid Luhn
    expect(validateLuhnChecksum("79927398710")).toBe(false);
  });

  it("parses 23-digit ARN into constituent metadata components", () => {
    const parsed = parseArn(SAMPLE_VISA_ARN);
    expect(parsed.isValidLength).toBe(true);
    expect(parsed.networkFamily).toBe("visa");
    expect(parsed.acquirerBin).toBe("400012");
    expect(parsed.julianDayOfYear).toBe(250);
    expect(parsed.sequenceNumber).toBe("000000000001");
  });

  it("rejects non-23-digit ARNs gracefully", () => {
    const parsed = parseArn("12345");
    expect(parsed.isValidLength).toBe(false);
    expect(parsed.networkFamily).toBe("unknown");
  });

  it("indexes gateway records and correlates clearing records with O(1) efficiency", () => {
    const correlator = new ArnCorrelator<{ id: string; arn: string; amountCents: number }>();

    const gatewayRecords = [
      { id: "ch_visa_001", arn: SAMPLE_VISA_ARN, amountCents: 5000 },
      { id: "ch_mc_002", arn: "51000062510000000000021", amountCents: 12000 },
    ];

    correlator.registerGatewayRecords(gatewayRecords);

    // Incoming bank clearing row referencing identical ARN
    const clearingRow = {
      id: "stmt_line_891",
      arn: "4000-1262-5000-0000-0000-014", // with hyphens
      amountCents: 5000,
    };

    const match = correlator.correlateClearingRecord(clearingRow);
    expect(match).not.toBeNull();
    expect(match?.gatewayRecord.id).toBe("ch_visa_001");
    expect(match?.isExactArnMatch).toBe(true);
    expect(match?.parsedMetadata.networkFamily).toBe("visa");
  });
});
