import {
  createRequestSigningMiddleware,
  MiddlewareChain,
  type RequestContext,
  type ResponseContext,
} from "../utils/middleware";
import { createHmac } from "node:crypto";

describe("Astra SDK Request-Signing Middleware", () => {
  const SECRET = "whsec_test_enterprise_secret_891";

  it("signs outgoing request payloads with valid HMAC-SHA256 headers", async () => {
    const chain = new MiddlewareChain();
    chain.use(createRequestSigningMiddleware(SECRET));

    const context: RequestContext = {
      method: "POST",
      path: "/api/v1/astra/reconcile",
      headers: { "Content-Type": "application/json" },
      body: { tenantId: "tenant_alpha", amountCents: 50000 },
    };

    const handler = async (ctx: RequestContext): Promise<ResponseContext> => {
      return {
        status: 200,
        headers: {},
        data: { receivedHeaders: ctx.headers },
      };
    };

    const response = await chain.execute(context, handler);
    expect(response.status).toBe(200);

    // Verify signature header existence
    expect(context.headers["x-settler-timestamp"]).toBeDefined();
    expect(context.headers["x-settler-signature"]).toBeDefined();

    const timestamp = context.headers["x-settler-timestamp"]!;
    const sigHeader = context.headers["x-settler-signature"]!;

    // Verify signature structure: t=timestamp,v1=signature
    expect(sigHeader).toContain(`t=${timestamp}`);
    const match = sigHeader.match(/v1=([a-f0-9]{64})/);
    expect(match).not.toBeNull();

    // Verify cryptographic signature recalculation matches
    const expectedPayload = `${timestamp}.POST./api/v1/astra/reconcile.${JSON.stringify(context.body)}`;
    const expectedSignature = createHmac("sha256", SECRET).update(expectedPayload).digest("hex");
    expect(match![1]).toBe(expectedSignature);
  });
});
