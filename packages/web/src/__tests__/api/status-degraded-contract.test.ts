/** @jest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("status API degraded-mode contract", () => {
  it("keeps /api/status returning 200 degraded envelope instead of hard 500", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/api/status/route.ts"), "utf-8");

    expect(source).toContain('overallStatus: "degraded"');
    expect(source).toContain('error: "Unable to fetch system status"');
    expect(source).toContain("{ status: 200 }");
  });

  it("keeps /api/status/health returning 200 degraded envelope instead of hard 500", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/status/health/route.ts"),
      "utf-8"
    );

    expect(source).toContain("status: \"degraded\"");
    expect(source).toContain("healthy: false");
    expect(source).toContain("error: \"Unable to complete health probe\"");
    expect(source).toContain("{ status: 200 }");
  });
});
