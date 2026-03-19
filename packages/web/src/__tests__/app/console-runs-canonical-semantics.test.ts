import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("console runs page canonical semantics", () => {
  it("renders canonical summary fields instead of legacy mismatch placeholders", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/console/runs/page.tsx"), "utf-8");

    expect(source).toContain("run.summary.matched");
    expect(source).toContain("run.summary.unmatched");
    expect(source).toContain("run.summarySemantics.exceptioned");
    expect(source).toContain("run.summarySemantics.unresolved");
    expect(source).not.toContain("run.summary.totalItems");
    expect(source).not.toContain("run.summary.mismatched");
    expect(source).not.toContain("run.summary.missing");
  });
});
