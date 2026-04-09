import { describe, it, expect, beforeEach } from "@jest/globals";
import { SettlerClient } from "../client";
import { collectPaginated } from "../utils/pagination";
import { mockCreateJobRequest, mockCreateWebhookRequest } from "./fixtures";

describe("Integration Tests", () => {
  let client: SettlerClient;

  beforeEach(() => {
    client = new SettlerClient({
      apiKey: "test_api_key",
      baseUrl: "https://api.settler.dev",
    });
  });

  describe("end-to-end workflows", () => {
    it("should create and manage a reconciliation job", async () => {
      // Create job
      const createResponse = await client.jobs.create(mockCreateJobRequest);
      expect(createResponse.data.id).toBeDefined();

      // Get job
      const jobResponse = await client.jobs.get(createResponse.data.id);
      expect(jobResponse.data.name).toBe(mockCreateJobRequest.name);

      // Run job
      const runResponse = await client.jobs.run(createResponse.data.id);
      expect(runResponse.data.status).toBe("running");

      // Get report
      const reportResponse = await client.reports.get(createResponse.data.id, {
        startDate: "2026-01-01",
        endDate: "2026-01-31",
      });
      expect(reportResponse.data.summary).toBeDefined();

      // Delete job
      await expect(client.jobs.delete(createResponse.data.id)).resolves.not.toThrow();
    });

    it("should create and manage webhooks", async () => {
      // Create webhook
      const createResponse = await client.webhooks.create(mockCreateWebhookRequest);
      expect(createResponse.data.id).toBeDefined();
      expect(createResponse.data.url).toBe(mockCreateWebhookRequest.url);

      // List webhooks
      const listResponse = await client.webhooks.list();
      expect(listResponse.data.length).toBeGreaterThan(0);

      // Delete webhook
      await expect(client.webhooks.delete(createResponse.data.id)).resolves.not.toThrow();
    });

    it("should list and get adapters", async () => {
      // List adapters
      const listResponse = await client.adapters.list();
      expect(listResponse.data.length).toBeGreaterThan(0);

      // Get specific adapter
      const stripeAdapter = await client.adapters.get("stripe");
      expect(stripeAdapter.data.id).toBe("stripe");
      expect(stripeAdapter.data.config).toBeDefined();
    });
  });

  describe("pagination", () => {
    it("should iterate over paginated results", async () => {
      const jobs: any[] = [];
      for await (const job of client.jobs.listPaginated()) {
        jobs.push(job);
        if (jobs.length >= 5) break; // Limit for test
      }
      expect(jobs.length).toBeGreaterThan(0);
    });

    it("should collect all paginated results", async () => {
      const allJobs = await collectPaginated(client.jobs.listPaginated());
      expect(allJobs).toBeInstanceOf(Array);
    });
  });

  describe("middleware", () => {
    it("should execute middleware chain", async () => {
      const logs: string[] = [];

      client.use(async (context, next) => {
        logs.push(`before: ${context.method} ${context.path}`);
        const response = await next();
        logs.push(`after: ${response.status}`);
        return response;
      });

      await client.jobs.list();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toContain("before:");
      expect(logs[1]).toContain("after:");
    });
  });
});
