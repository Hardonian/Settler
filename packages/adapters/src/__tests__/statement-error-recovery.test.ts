import { detectDelimiter, recoverStatement } from "../statement-error-recovery";

describe("Automated Statement Ingestion Error Recovery", () => {
  describe("detectDelimiter", () => {
    it("correctly identifies comma, semicolon, tab, and pipe delimiters", () => {
      expect(detectDelimiter("id,amount,date\n1,100,2026-01-01\n2,200,2026-01-02")).toBe(",");
      expect(detectDelimiter("id;amount;date\n1;100;2026-01-01\n2;200;2026-01-02")).toBe(";");
      expect(detectDelimiter("id\tamount\tdate\n1\t100\t2026-01-01\n2\t200\t2026-01-02")).toBe(
        "\t"
      );
      expect(detectDelimiter("id|amount|date\n1|100|2026-01-01\n2|200|2026-01-02")).toBe("|");
    });
  });

  describe("recoverStatement", () => {
    it("strips UTF-8 BOM, null bytes, and non-printable control characters", () => {
      const bomWithNulls = "\uFEFFid,name,amount\n1,Alpha\x00Beta,1000\n2,Gamma\x07Delta,2000";
      const result = recoverStatement(bomWithNulls);

      expect(result.recoveredContent).not.toContain("\uFEFF");
      expect(result.recoveredContent).not.toContain("\x00");
      expect(result.recoveredContent).not.toContain("\x07");
      expect(result.anomalyCorrectionsCount).toBeGreaterThan(0);
      expect(result.recoveryMerkleRoot).toMatch(/^[a-f0-9]{64}$/);
    });

    it("pads ragged rows that have missing trailing column values", () => {
      const raggedCsv =
        "tx_id,amount,currency,status\ntx_1,1000,USD,CLEARED\ntx_2,2000,USD\ntx_3,500";
      const result = recoverStatement(raggedCsv);

      const lines = result.recoveredContent.split("\n");
      expect(lines.length).toBe(4);
      // All lines should have 4 fields (3 commas)
      for (const line of lines) {
        expect(line.split(",").length).toBe(4);
      }
      expect(result.anomalyCorrectionsCount).toBe(2); // tx_2 and tx_3 padded
    });
  });
});
