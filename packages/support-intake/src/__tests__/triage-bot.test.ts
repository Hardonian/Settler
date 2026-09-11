import { describe, it, expect } from "vitest";
import { DeveloperTriageBot } from "../triage-bot";

describe("DeveloperTriageBot", () => {
  const bot = new DeveloperTriageBot();

  it("triages tenant invariant exceptions and gives correct remediation", () => {
    const res = bot.triage({
      platform: "discord",
      channelId: "channel-123",
      senderId: "dev-456",
      messageContent:
        "Help! Getting Error: TenantId invariant violation when posting bilateral settlement batch",
    });

    expect(res.isKnownIssue).toBe(true);
    expect(res.category).toBe("AUTH_FAILURE");
    expect(res.severity).toBe("HIGH");
    expect(res.autoResponseMarkdown).toContain("Tenant Invariant Exception");
  });

  it("triages rate limit errors", () => {
    const res = bot.triage({
      platform: "slack",
      channelId: "c-999",
      senderId: "u-111",
      messageContent: "Got HTTP 429 Rate limit exceeded on /api/v1/reconcile",
    });

    expect(res.category).toBe("RATE_LIMIT");
    expect(res.autoResponseMarkdown).toContain("tier rate ceiling");
  });

  it("triages unsupported schema version", () => {
    const res = bot.triage({
      platform: "github",
      channelId: "issues",
      senderId: "contributor-1",
      messageContent: "Client fails when requesting schema v0.9",
      schemaVersion: "v0.9",
    });

    expect(res.category).toBe("SCHEMA_VALIDATION");
    expect(res.autoResponseMarkdown).toContain("Schema version `v0.9` is unsupported");
  });
});
