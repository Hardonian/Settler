import { detectReconChange } from "../../../../../pr-overlay/ReconChangeDetector";

describe("detectReconChange", () => {
  it("flags rule file updates", () => {
    const result = detectReconChange([
      "packages/api/src/recon/rules.ts",
      "packages/web/src/app/page.tsx",
    ]);

    expect(result.changed).toBe(true);
    expect(result.matchedFiles).toContain("packages/api/src/recon/rules.ts");
  });

  it("ignores unrelated changes", () => {
    const result = detectReconChange(["packages/web/src/app/page.tsx"]);

    expect(result.changed).toBe(false);
    expect(result.matchedFiles).toHaveLength(0);
  });
});
