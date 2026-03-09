/** @jest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("stripe API setup gating", () => {
  it("checkout route returns 503 + setupRequired when Stripe config is missing", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/stripe/checkout/route.ts"),
      "utf-8"
    );

    expect(source).toContain("error instanceof StripeConfigurationError");
    expect(source).toContain("setupRequired: true");
    expect(source).toContain("{ status: 503 }");
  });

  it("portal route returns 503 + setupRequired when Stripe config is missing", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/stripe/portal/route.ts"),
      "utf-8"
    );

    expect(source).toContain("error instanceof StripeConfigurationError");
    expect(source).toContain("setupRequired: true");
    expect(source).toContain("{ status: 503 }");
  });
});
