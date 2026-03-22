/**
 * Production / Demo Boundary Tests
 *
 * Proves that:
 * 1. Production recon jobs route does not import demo modules
 * 2. Production route source contains no demo fallback data
 * 3. Production error responses do not leak demo markers
 * 4. robots.ts disallows all demo paths
 */

import * as fs from "fs";
import * as path from "path";

const SRC_ROOT = path.join(process.cwd(), "src");

function readSource(relPath: string): string {
  return fs.readFileSync(path.join(SRC_ROOT, relPath), "utf8");
}

describe("production recon jobs route does not import demo modules", () => {
  const source = readSource("app/api/v1/recon/jobs/route.ts");

  it("does not import from @/lib/demo/*", () => {
    const importSources = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
    const demoImports = importSources.filter((s) => s!.includes("/demo/") || s!.includes("/demo-"));
    expect(demoImports).toEqual([]);
  });

  it("does not reference showcase-data module", () => {
    expect(source).not.toContain("showcase-data");
    expect(source).not.toContain("getShowcaseDataset");
    expect(source).not.toContain("getDefaultShowcaseTenant");
  });

  it("does not reference demoJsonResponse helper", () => {
    expect(source).not.toContain("demoJsonResponse");
    expect(source).not.toContain("checkDemoRateLimit");
  });
});

describe("production route contains no demo fallback data", () => {
  const source = readSource("app/api/v1/recon/jobs/route.ts");

  it("does not contain demo: true markers", () => {
    expect(source).not.toMatch(/["']?demo["']?\s*:\s*true/);
  });

  it("does not contain demo: false markers", () => {
    expect(source).not.toMatch(/["']?demo["']?\s*:\s*false/);
  });

  it("does not contain hardcoded demo arrays or fake job payloads", () => {
    expect(source).not.toContain("isAuthenticated = true");
    expect(source).not.toContain("Acme Commerce");
    expect(source).not.toContain("showcase");
  });
});

describe("production route auth enforcement", () => {
  const source = readSource("app/api/v1/recon/jobs/route.ts");

  it("POST handler has requireAuth: true in withSecurity config", () => {
    // Find the POST withSecurity call and verify requireAuth
    const postSection = source.slice(
      source.indexOf("export const POST"),
      source.indexOf("export const GET")
    );
    expect(postSection).toContain("requireAuth: true");
  });

  it("GET handler has requireAuth: true in withSecurity config", () => {
    const getSection = source.slice(source.indexOf("export const GET"));
    expect(getSection).toContain("requireAuth: true");
  });

  it("POST handler returns 401 for missing auth", () => {
    expect(source).toContain("SETTLER_UNAUTHORIZED");
    expect(source).toContain("status: 401");
  });

  it("GET handler returns 401 for missing auth", () => {
    const getSection = source.slice(source.indexOf("export const GET"));
    expect(getSection).toContain("SETTLER_UNAUTHORIZED");
    expect(getSection).toContain("status: 401");
  });

  it("401 responses direct users to /api/demo/* instead of leaking data", () => {
    const unauthorizedResponses = source.match(/SETTLER_UNAUTHORIZED[\s\S]{0,300}?status:\s*401/g);
    expect(unauthorizedResponses).not.toBeNull();
    expect(unauthorizedResponses!.length).toBeGreaterThanOrEqual(2);
    expect(source).toContain("/api/demo/*");
  });
});

describe("production error responses are honest", () => {
  const source = readSource("app/api/v1/recon/jobs/route.ts");

  it("500 errors do not include demo field", () => {
    // Find all 500 response blocks
    const errorBlocks = source.match(/status:\s*500[\s\S]{0,200}/g) || [];
    for (const block of errorBlocks) {
      expect(block).not.toContain("demo");
    }
  });

  it("top-level catch blocks return 500 status", () => {
    // The route has two top-level try/catch handlers (POST and GET).
    // Both outer catches should return status 500.
    const status500Occurrences = source.match(/status:\s*500/g) || [];
    expect(status500Occurrences.length).toBeGreaterThanOrEqual(2);
  });
});

describe("robots.ts blocks all demo paths", () => {
  const source = readSource("app/robots.ts");

  it("disallows /demo/ path prefix", () => {
    expect(source).toContain('"/demo/"');
  });

  it("does not leave /demo/console as only blocked demo path", () => {
    // Should use broad /demo/ not specific /demo/console
    expect(source).not.toContain('"/demo/console"');
  });
});
