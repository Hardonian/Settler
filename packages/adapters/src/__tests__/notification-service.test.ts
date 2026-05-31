import { NotificationService, notificationService } from "../alerting/notification-service";

describe("NotificationService", () => {
  const originalEnv = process.env;
  let consoleInfoSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
    consoleInfoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
    consoleInfoSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("should initialize with empty configs when no env vars are set", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.ALERT_EMAIL_TO;
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.PAGERDUTY_INTEGRATION_KEY;
    delete process.env.ALERT_WEBHOOK_URL;

    const service = new NotificationService();
    expect(service.hasAnyConfiguration()).toBe(false);
    expect(service.getEnabledChannels()).toHaveLength(0);
  });

  it("should configure email when resend env vars are set", () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.ALERT_EMAIL_TO = "test@example.com";

    const service = new NotificationService();
    expect(service.hasAnyConfiguration()).toBe(true);
    expect(service.getEnabledChannels()).toContain("email");
  });

  it("should configure slack when slack env vars are set", () => {
    process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";

    const service = new NotificationService();
    expect(service.hasAnyConfiguration()).toBe(true);
    expect(service.getEnabledChannels()).toContain("slack");
  });

  it("should configure pagerduty when pagerduty env vars are set", () => {
    process.env.PAGERDUTY_INTEGRATION_KEY = "pd-key";

    const service = new NotificationService();
    expect(service.hasAnyConfiguration()).toBe(true);
    expect(service.getEnabledChannels()).toContain("pagerduty");
  });

  it("should configure webhook when webhook env vars are set", () => {
    process.env.ALERT_WEBHOOK_URL = "https://webhook.example.com/test";

    const service = new NotificationService();
    expect(service.hasAnyConfiguration()).toBe(true);
    expect(service.getEnabledChannels()).toContain("webhook");
  });

  describe("sendNotification", () => {
    it("should send email notification", async () => {
      process.env.RESEND_API_KEY = "test-key";
      process.env.ALERT_EMAIL_TO = "test@example.com";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: "123" }),
      });

      await service.sendNotification({
        severity: "critical",
        title: "Test Alert",
        message: "This is a test",
        connectorId: "conn-1",
        tenantId: "tenant-1",
        timestamp: new Date(),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should catch and log errors for email notification", async () => {
      process.env.RESEND_API_KEY = "test-key";
      process.env.ALERT_EMAIL_TO = "test@example.com";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await service.sendNotification({
        severity: "critical",
        title: "Test Alert",
        message: "This is a test",
        connectorId: "conn-1",
        tenantId: "tenant-1",
        timestamp: new Date(),
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to send email notification:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it("should send slack notification", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await service.sendNotification({
        severity: "warning",
        title: "Slack Alert",
        message: "Slack test message",
        connectorId: "conn-2",
        tenantId: "tenant-2",
        timestamp: new Date(),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/test",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should include metadata in slack notification", async () => {
      process.env.SLACK_WEBHOOK_URL = "https://hooks.slack.com/test";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await service.sendNotification({
        severity: "warning",
        title: "Slack Alert",
        message: "Slack test message",
        connectorId: "conn-2",
        tenantId: "tenant-2",
        metadata: { foo: "bar" },
        timestamp: new Date(),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://hooks.slack.com/test",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should send pagerduty notification for critical severity", async () => {
      process.env.PAGERDUTY_INTEGRATION_KEY = "pd-key";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await service.sendNotification({
        severity: "critical",
        title: "PD Alert",
        message: "PD test message",
        connectorId: "conn-3",
        tenantId: "tenant-3",
        timestamp: new Date(),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://events.pagerduty.com/v2/enqueue",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should not send pagerduty notification for info severity", async () => {
      process.env.PAGERDUTY_INTEGRATION_KEY = "pd-key";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await service.sendNotification({
        severity: "info",
        title: "PD Alert",
        message: "PD test message",
        connectorId: "conn-3",
        tenantId: "tenant-3",
        timestamp: new Date(),
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should catch and log error for PagerDuty failure", async () => {
      process.env.PAGERDUTY_INTEGRATION_KEY = "pd-key";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await service.sendNotification({
        severity: "critical",
        title: "PD Alert",
        message: "PD test message",
        connectorId: "conn-3",
        tenantId: "tenant-3",
        timestamp: new Date(),
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to send pagerduty notification:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it("should send webhook notification", async () => {
      process.env.ALERT_WEBHOOK_URL = "https://webhook.example.com/test";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
      });

      await service.sendNotification({
        severity: "info",
        title: "Webhook Alert",
        message: "Webhook test message",
        connectorId: "conn-4",
        tenantId: "tenant-4",
        timestamp: new Date(),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://webhook.example.com/test",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("should catch and log error for webhook failure", async () => {
      process.env.ALERT_WEBHOOK_URL = "https://webhook.example.com/test";
      const service = new NotificationService();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      await service.sendNotification({
        severity: "info",
        title: "Webhook Alert",
        message: "Webhook test message",
        connectorId: "conn-4",
        tenantId: "tenant-4",
        timestamp: new Date(),
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to send webhook notification:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe("exported notificationService instance", () => {
    it("should be an instance of NotificationService", () => {
      expect(notificationService).toBeInstanceOf(NotificationService);
    });
  });
});
