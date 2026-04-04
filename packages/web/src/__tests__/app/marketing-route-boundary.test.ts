import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("marketing route auth/env boundary", () => {
  const marketingPageFiles = [
    "src/app/page.tsx",
    "src/app/about/page.tsx",
    "src/app/platform/page.tsx",
    "src/app/integrations/page.tsx",
    "src/app/security-and-audit/page.tsx",
    "src/app/contact/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/terms/page.tsx",
    "src/app/status/page.tsx",
  ] as const;

  const forbiddenImportPatterns = [
    "@/lib/supabase/server",
    "@/lib/supabase/client",
    "@supabase/",
    "@/lib/auth/",
    "@/shared/auth/",
    "next-auth",
  ] as const;

  const forbiddenEnvPatterns = [
    "process.env.SUPABASE",
    "process.env.NEXT_PUBLIC_SUPABASE",
    "process.env.STRIPE",
    "process.env.NEXT_PUBLIC_STRIPE",
  ] as const;

  it("keeps marketing pages free of auth/supabase imports", () => {
    for (const filePath of marketingPageFiles) {
      const source = readFileSync(resolve(process.cwd(), filePath), "utf-8");
      for (const forbiddenPattern of forbiddenImportPatterns) {
        expect(source).not.toContain(forbiddenPattern);
      }
    }
  });

  it("keeps marketing pages free of runtime auth/billing env assumptions", () => {
    for (const filePath of marketingPageFiles) {
      const source = readFileSync(resolve(process.cwd(), filePath), "utf-8");
      for (const forbiddenPattern of forbiddenEnvPatterns) {
        expect(source).not.toContain(forbiddenPattern);
      }
    }
  });
});
