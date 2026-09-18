import {
  GeminiAdapterSynthesizer,
  geminiAdapterSynthesizer,
  type SynthesizerRequest,
} from "../gemini-adapter-synthesizer";

describe("GeminiAdapterSynthesizer", () => {
  const TENANT = "tenant_enterprise_saudi_bank";

  it("rejects synthesis without tenantId", () => {
    expect(() => {
      geminiAdapterSynthesizer.synthesize({
        tenantId: "",
        connectorName: "saudi_sarie",
        apiSpecification: "{}",
      });
    }).toThrow("Tenant context invariant violation: tenantId is required");
  });

  it("synthesizes an enterprise connector and test suite from OpenAPI spec", () => {
    const apiSpec = `
      openapi: 3.0.0
      info:
        title: Saudi SARIE Real-Time Clearing API
        version: 1.2.0
      paths:
        /v1/transfers:
          get:
            responses:
              '200':
                content:
                  application/json:
                    schema:
                      type: object
                      properties:
                        transaction_id: { type: string }
                        amount_cents: { type: integer }
                        currency: { type: string }
                        timestamp: { type: string }
                        status: { type: string }
    `;

    const request: SynthesizerRequest = {
      tenantId: TENANT,
      connectorName: "saudi_sarie",
      version: "1.2.0",
      apiSpecification: apiSpec,
      authStrategy: "bearer",
      paginationStrategy: "cursor",
      defaultCurrency: "SAR",
    };

    const manifest = geminiAdapterSynthesizer.synthesize(request);

    expect(manifest.tenantId).toBe(TENANT);
    expect(manifest.connectorName).toBe("saudi_sarie");
    expect(manifest.className).toBe("SaudiSarieConnector");
    expect(manifest.generatedClassSource).toContain(
      "export class SaudiSarieConnector implements Connector"
    );
    expect(manifest.generatedClassSource).toContain('readonly name = "saudi_sarie"');
    expect(manifest.generatedClassSource).toContain('readonly version = "1.2.0"');
    expect(manifest.generatedTestSource).toContain('describe("SaudiSarieConnector"');
    expect(manifest.sha256Digest).toHaveLength(64);

    // Verify inferred mappings
    const idMap = manifest.fieldMappings.find((m) => m.targetField === "id");
    expect(idMap?.sourceField).toBe("transaction_id");

    const amountMap = manifest.fieldMappings.find((m) => m.targetField === "amount");
    expect(amountMap?.sourceField).toBe("amount_cents");
  });
});
