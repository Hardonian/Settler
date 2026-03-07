import { describe, expect, it } from "@jest/globals";
import { buildOkEnvelope, buildProblemDetails } from "@/lib/api/problem";

describe("api problem contract", () => {
  it("builds RFC7807 compatible payload with trace id", () => {
    const payload = buildProblemDetails({
      type: "https://settler.dev/problems/validation",
      title: "Validation failed",
      status: 400,
      detail: "dataset_id is required",
      traceId: "trace_123",
    });

    expect(payload).toEqual({
      type: "https://settler.dev/problems/validation",
      title: "Validation failed",
      status: 400,
      detail: "dataset_id is required",
      trace_id: "trace_123",
    });
  });

  it("normalizes success envelope with trace id", () => {
    const payload = buildOkEnvelope({ result: "ok" }, "trace_456");

    expect(payload).toEqual({
      data: { result: "ok" },
      trace_id: "trace_456",
    });
  });
});
