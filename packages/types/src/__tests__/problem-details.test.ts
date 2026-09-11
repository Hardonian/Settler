import { describe, it, expect } from "vitest";
import { createProblemDetails } from "../problem-details.js";

describe("RFC 7807 Problem Details Error Envelope", () => {
  it("constructs standard problem details with default type and instance", () => {
    const error = createProblemDetails({
      title: "Tenant Mismatch",
      status: 403,
      detail: "Cross-tenant access rejected at repository boundary",
      code: "TENANT_MISMATCH",
      tenantId: "tenant_acme_corp",
      traceId: "trace_req_12345",
    });

    expect(error.title).toBe("Tenant Mismatch");
    expect(error.status).toBe(403);
    expect(error.code).toBe("TENANT_MISMATCH");
    expect(error.type).toBe("https://api.settler.io/errors/tenant_mismatch");
    expect(error.instance).toBe("/v1/requests/trace_req_12345");
    expect(error.tenantId).toBe("tenant_acme_corp");
    expect(error.traceId).toBe("trace_req_12345");
    expect(new Date(error.timestamp).getTime()).not.toBeNaN();
  });

  it("attaches invalid parameter details and Merkle root context", () => {
    const error = createProblemDetails({
      type: "urn:settler:error:invalid-journal-payload",
      title: "Unbalanced Double-Entry Batch",
      status: 422,
      detail: "Sum of debits does not equal sum of credits (delta: 140 cents)",
      instance: "/api/v1/astra/ledger/post",
      code: "UNBALANCED_JOURNAL",
      tenantId: "tenant_fintech_inc",
      invalidParams: [
        { name: "lines[0].debitCents", reason: "Exceeds total credit allocations", value: 10000 },
        { name: "lines[1].creditCents", reason: "Missing balancing offset", value: 9860 },
      ],
      merkleRoot: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    });

    expect(error.type).toBe("urn:settler:error:invalid-journal-payload");
    expect(error.status).toBe(422);
    expect(error.invalidParams?.length).toBe(2);
    expect(error.invalidParams?.[0]?.name).toBe("lines[0].debitCents");
    expect(error.merkleRoot).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });
});
