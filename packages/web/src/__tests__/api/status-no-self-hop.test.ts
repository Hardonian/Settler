import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("status route internal hop guardrail", () => {
  it("does not call its own health endpoint over HTTP", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/api/status/route.ts"), "utf-8");

    // expect(source).toContain("checkApplicationRuntimeHealth");
    expect(source).not.toContain("/api/status/health");
    expect(source).not.toContain("NEXT_PUBLIC_SITE_URL");
  });
});
