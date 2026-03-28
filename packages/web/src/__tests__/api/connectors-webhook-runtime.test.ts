/** @jest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("connector webhook runtime hardening invariants", () => {
  it("keeps connector webhook route public (billing bypass) but signature-gated", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/connectors/webhook/[providerId]/route.ts"),
      "utf-8"
    );

    expect(source).toContain('{ allowPublic: true, feature: "Connector webhooks" }');
    expect(source).toContain('error: "WEBHOOK_SECRET_NOT_CONFIGURED"');
    expect(source).toContain('error: "WEBHOOK_SIGNATURE_MISSING"');
    expect(source).toContain("verifyWebhook(providerId, rawBody, signature, webhookSecret)");
    expect(source).toContain("assertWebhookConfigsTenantScoping(prisma)");
    expect(source).toContain("WEBHOOK_PERSISTENCE_UNAVAILABLE");
    expect(source).toContain("duplicate: true");
    expect(source).toContain('"Webhook accepted and persisted"');
  });

  it("keeps timestamp freshness guard and node runtime", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/connectors/webhook/[providerId]/route.ts"),
      "utf-8"
    );

    expect(source).toContain('export const runtime = "nodejs"');
    expect(source).toContain("WEBHOOK_TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000");
    expect(source).toContain('error: "WEBHOOK_TIMESTAMP_INVALID"');
  });
});
