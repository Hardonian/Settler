import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("console layout role hydration", () => {
  it("passes super admin scope from the server layout instead of a client-side role fetch", () => {
    const layoutSource = readFileSync(
      resolve(process.cwd(), "src/app/console/layout.tsx"),
      "utf-8"
    );
    const clientShellSource = readFileSync(
      resolve(process.cwd(), "src/components/console/ConsoleLayout.tsx"),
      "utf-8"
    );

    expect(layoutSource).toContain("const hasSuperAdminScope = await isSuperAdmin()");
    expect(layoutSource).toContain("<ConsoleLayout isSuperAdmin={hasSuperAdminScope}>");
    expect(clientShellSource).not.toContain('fetch("/api/console/user-role")');
  });
});
