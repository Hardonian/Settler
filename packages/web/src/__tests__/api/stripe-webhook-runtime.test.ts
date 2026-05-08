/** @jest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("webhook runtime invariants", () => {
  it("keeps stripe webhook runtime and raw body verification path", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/stripe/webhook/route.ts"),
      "utf-8"
    );

    expect(source).toContain('export const runtime = "nodejs"');
    expect(source).toContain("const body = await request.text();");
    expect(source).toContain("stripe.webhooks.constructEvent(body, signature, webhookSecret)");
  });

  it("keeps builder webhook on node runtime for crypto signature verification", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/builder/revalidate/route.ts"),
      "utf-8"
    );

    expect(source).toMatch(/export const runtime = ['"]nodejs['"]/);
    expect(source).toMatch(/const rawBody = await request.text\(\);/);
    expect(source).toMatch(/createHmac/);
  });
});
