import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("rendering strategy guardrails", () => {
  it("keeps root layout static-safe (no cookies()/headers() dynamic trigger)", () => {
    const layoutSource = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf-8");

    expect(layoutSource).not.toContain('from "next/headers"');
    expect(layoutSource).not.toContain("cookies(");
    expect(layoutSource).not.toContain("headers(");
  });

  it("keeps marketing home page as a server component shell", () => {
    const homeSource = readFileSync(
      resolve(process.cwd(), "src/app/(marketing)/home/page.tsx"),
      "utf-8"
    );

    expect(homeSource.startsWith('"use client";')).toBe(false);
    expect(homeSource.startsWith("'use client';")).toBe(false);
  });
});
