import {
  buildAlertRouter,
  buildNotifierCapabilities,
  createNotifierProviders,
  dispatchAlert,
  sanitizeAlertPayload,
  type AlertPayload,
} from "../../services/operator-mode/notifier-provider";

describe("notifier provider", () => {
  const payload: AlertPayload = {
    alertId: "alert_1",
    alertType: "run_failure_spike",
    severity: "critical",
    summary: "Run failures exceeded baseline",
    tenantId: "tenant_1",
    runId: "run_1",
    timestamp: new Date().toISOString(),
  };

  it("reports channel capabilities from env-style config", () => {
    const capabilities = buildNotifierCapabilities({
      slackWebhookUrl: "https://hooks.slack.test/abc",
      teamsWebhookUrl: undefined,
      telegramBotToken: "bot_token",
      telegramChatId: undefined,
    });

    expect(capabilities.find((c) => c.channel === "slack")?.status).toBe("configured");
    expect(capabilities.find((c) => c.channel === "teams")?.status).toBe("unavailable");
    expect(capabilities.find((c) => c.channel === "telegram")?.status).toBe("degraded");
  });

  it("routes by severity", () => {
    const router = buildAlertRouter(["slack", "teams", "telegram"]);

    expect(router.resolveChannels({ severity: "info", alertType: "x" })).toEqual(["slack"]);
    expect(router.resolveChannels({ severity: "warning", alertType: "x" })).toEqual([
      "slack",
      "teams",
    ]);
    expect(router.resolveChannels({ severity: "critical", alertType: "x" })).toEqual([
      "slack",
      "teams",
      "telegram",
    ]);
  });

  it("sanitizes alert payloads before dispatch", () => {
    const sanitized = sanitizeAlertPayload({
      ...payload,
      summary: "  leaked token sk_test_123 and jwt token=abc  ",
      operatorUrl: "https://ops.settler.test/runs/1?token=secret#frag",
      metadata: { apiKey: "rk_secret", nested: { password: "x" } },
    });

    expect(sanitized.summary.length).toBeLessThanOrEqual(280);
    expect(sanitized.operatorUrl).toBe("https://ops.settler.test/runs/1");
    expect(sanitized.metadata).toEqual({
      apiKey: "[REDACTED]",
      nested: { password: "[REDACTED]" },
    });
  });

  it("supports dry-run notification dispatch without network side effects", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    const providers = createNotifierProviders(
      {
        slackWebhookUrl: "https://hooks.slack.test/abc",
        teamsWebhookUrl: "https://teams.test/webhook",
        telegramBotToken: "token",
        telegramChatId: "chat-id",
        dryRun: true,
      },
      fetchMock as unknown as typeof fetch
    );

    const delivered = await dispatchAlert(
      payload,
      providers,
      buildAlertRouter(["slack", "teams", "telegram"])
    );

    expect(delivered).toHaveLength(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
