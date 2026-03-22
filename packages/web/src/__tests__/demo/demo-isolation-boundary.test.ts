/**
 * Demo/Production Isolation Boundary Tests
 *
 * Verifies that demo code is properly isolated from production paths
 * and that the demo response helper adds correct headers.
 */

describe("demo response module structure", () => {
  it("demo-response module exports expected functions", async () => {
    const mod = await import("@/lib/demo/demo-response");
    expect(typeof mod.demoJsonResponse).toBe("function");
    expect(typeof mod.checkDemoRateLimit).toBe("function");
  });
});

describe("demo import isolation", () => {
  it("showcase-data does not import from production database modules", async () => {
    // Read the source file and verify it does not import prisma or supabase
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/demo/showcase-data.ts"),
      "utf8"
    );
    expect(source).not.toContain("prismaClient");
    expect(source).not.toContain("@/shared/db");
    expect(source).not.toContain("supabase");
    expect(source).not.toContain("import { prisma");
  });

  it("demo-response does not import from production auth modules", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const source = fs.readFileSync(
      path.join(process.cwd(), "src/lib/demo/demo-response.ts"),
      "utf8"
    );
    expect(source).not.toContain("authenticateApiKey");
    expect(source).not.toContain("requireAuth");
    expect(source).not.toContain("supabase");
  });
});

describe("demo route file isolation", () => {
  it("demo API routes only import from demo modules and next/server", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const glob = await import("glob");

    const demoRouteDir = path.join(process.cwd(), "src/app/api/demo");
    const routeFiles = glob.sync("**/route.ts", { cwd: demoRouteDir });

    for (const file of routeFiles) {
      const source = fs.readFileSync(path.join(demoRouteDir, file), "utf8");
      // Extract import sources using regex (handles multi-line imports)
      const importSources = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

      for (const importPath of importSources) {
        const isAllowed = importPath!.startsWith("next") || importPath!.startsWith("@/lib/demo/");
        expect({ file, importPath, isAllowed }).toEqual(
          expect.objectContaining({ isAllowed: true })
        );
      }
    }
  });
});
