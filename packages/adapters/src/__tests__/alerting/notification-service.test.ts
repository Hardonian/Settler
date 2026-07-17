import { NotificationService, NotificationPayload } from "../../alerting/notification-service";

describe("NotificationService", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let mockFetch: jest.Mock;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };

    // Clear environment for clean tests
    delete process.env.RESEND_API_KEY;
    delete process.env.ALERT_EMAIL_TO;
    delete process.env.ALERT_EMAIL_FROM;
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.SLACK_CHANNEL;
    delete process.env.SLACK_USERNAME;
    delete process.env.PAGERDUTY_INTEGRATION_KEY;
    delete process.env.ALERT_WEBHOOK_URL;

    // Mock fetch
    originalFetch = global.fetch;
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "mock-id" }),
      text: async () => "mock-text",
    });
    global.fetch = mockFetch;

    // Mock console methods to avoid test noise
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe("Configuration Loading", () => {
    it("should load no channels when env vars are missing", () => {
      const service = new NotificationService();
      expect(service.getEnabledChannels()).toEqual([]);
      expect(service.hasAnyConfiguration()).toBe(false);
    });

    it("should load email config when RESEND vars are present", () => {
      process.env.RESEND_API_KEY = "test-resend-key";
      process.env.ALERT_EMAIL_TO = "alerts@example.com";

      const service = new NotificationService();
      expect(service.getEnabledChannels()).toContain("email");
      expect(service.hasAnyConfiguration()).toBe(true);
    });

    it("should load slack config when SLACK vars are present", () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";

      const service = new NotificationService();
      expect(service.getEnabledChannels()).toContain("slack");
    });

    it("should load pagerduty config when PAGERDUTY vars are present", () => {
      process.env.PAGERDUTY_INTEGRATION_KEY = "test-pd-key";

      const service = new NotificationService();
      expect(service.getEnabledChannels()).toContain("pagerduty");
    });

    it("should load webhook config when WEBHOOK vars are present", () => {
      process.env.ALERT_WEBHOOK_URL = "https://webhook.example.com";

      const service = new NotificationService();
      expect(service.getEnabledChannels()).toContain("webhook");
    });
  });

  describe("Sending Notifications", () => {
    const basePayload: NotificationPayload = {
      severity: "critical",
      title: "Test Alert",
      message: "This is a test alert",
      connectorId: "test-connector",
      tenantId: "test-tenant",
      timestamp: new Date("2024-01-01T00:00:00.000Z"),
    };

    beforeEach(() => {
      // Enable all channels
      process.env.RESEND_API_KEY = "test-resend-key";
      process.env.ALERT_EMAIL_TO = "alerts@example.com";
      process.env.ALERT_EMAIL_FROM = "from@example.com";
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      process.env.PAGERDUTY_INTEGRATION_KEY = "test-pd-key";
      process.env.ALERT_WEBHOOK_URL = "https://webhook.example.com";
    });

    it("should send to all configured channels", async () => {
      const service = new NotificationService();
      await service.sendNotification(basePayload);

      // Verify email was sent
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-resend-key",
          }),
        })
      );

      // Verify slack was sent
      expect(mockFetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/test",
        expect.objectContaining({
          method: "POST",
        })
      );

      // Verify pagerduty was sent
      expect(mockFetch).toHaveBeenCalledWith(
        "https://events.pagerduty.com/v2/enqueue",
        expect.objectContaining({
          method: "POST",
        })
      );

      // Verify generic webhook was sent
      expect(mockFetch).toHaveBeenCalledWith(
        "https://webhook.example.com",
        expect.objectContaining({
          method: "POST",
        })
      );

      // 4 channels configured
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it("should include metadata in payloads if provided", async () => {
      const service = new NotificationService();
      const payloadWithMetadata = {
        ...basePayload,
        metadata: { error_type: "connection_failed", attempt: 3 },
      };

      await service.sendNotification(payloadWithMetadata);

      // Check Slack call for metadata
      const slackCall = mockFetch.mock.calls.find(
        (call) => call[0] === "https://hooks.slack.com/test"
      );
      expect(slackCall).toBeDefined();
      const slackBody = JSON.parse(slackCall![1].body);

      const hasMetadataField = slackBody.attachments[0].fields.some(
        (field: any) => field.title === "Metadata" && field.value.includes("connection_failed")
      );
      expect(hasMetadataField).toBe(true);
    });

    it("should format email correctly", async () => {
      const service = new NotificationService();
      await service.sendNotification(basePayload);

      const emailCall = mockFetch.mock.calls.find(
        (call) => call[0] === "https://api.resend.com/emails"
      );
      expect(emailCall).toBeDefined();
      const emailBody = JSON.parse(emailCall![1].body);

      expect(emailBody.from).toBe("from@example.com");
      expect(emailBody.to).toBe("alerts@example.com");
      expect(emailBody.subject).toBe("[CRITICAL] Test Alert");
      expect(emailBody.text).toContain("CRITICAL");
      expect(emailBody.text).toContain("test-connector");
    });

    it("should not send to PagerDuty for 'info' severity", async () => {
      const service = new NotificationService();
      await service.sendNotification({
        ...basePayload,
        severity: "info",
      });

      const pdCall = mockFetch.mock.calls.find(
        (call) => call[0] === "https://events.pagerduty.com/v2/enqueue"
      );
      expect(pdCall).toBeUndefined(); // Should not be called

      // Other channels should still be called
      expect(mockFetch).toHaveBeenCalledWith("https://api.resend.com/emails", expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith("https://hooks.slack.com/test", expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith("https://webhook.example.com", expect.any(Object));
    });

    it("should handle failures in one channel without affecting others", async () => {
      const service = new NotificationService();

      // Make Slack throw an error
      mockFetch.mockImplementation(async (url) => {
        if (url === "https://hooks.slack.com/test") {
          throw new Error("Network error");
        }
        return { ok: true, json: async () => ({}), text: async () => "" };
      });

      // Should not throw, should log error
      await expect(service.sendNotification(basePayload)).resolves.not.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        "Failed to send slack notification:",
        expect.any(Error)
      );

      // Other channels should still have been called
      expect(mockFetch).toHaveBeenCalledWith("https://api.resend.com/emails", expect.any(Object));
      expect(mockFetch).toHaveBeenCalledWith(
        "https://events.pagerduty.com/v2/enqueue",
        expect.any(Object)
      );
    });

    it("should handle non-ok responses from fetch", async () => {
      const service = new NotificationService();

      // Make Resend return 400
      mockFetch.mockImplementation(async (url) => {
        if (url === "https://api.resend.com/emails") {
          return { ok: false, status: 400, text: async () => "Bad Request" };
        }
        return { ok: true, json: async () => ({}), text: async () => "" };
      });

      await service.sendNotification(basePayload);

      expect(console.error).toHaveBeenCalledWith(
        "Failed to send email notification:",
        expect.objectContaining({
          message: expect.stringContaining("Resend API error: 400 Bad Request"),
        })
      );
    });
  });
});
