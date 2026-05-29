import {
  isValidCronExpression,
  validateRefreshConfig,
  getViewTemplate,
  COMMON_VIEW_TEMPLATES,
  DEFAULT_TENANT_VIEW_SETTINGS,
  DEFAULT_REFRESH_CONFIGS,
  RefreshConfig,
} from "../MaterializedViewConfig";

describe("MaterializedViewConfig", () => {
  describe("isValidCronExpression", () => {
    it("should return true for valid cron expressions", () => {
      expect(isValidCronExpression("* * * * *")).toBe(true);
      expect(isValidCronExpression("0 * * * *")).toBe(true);
      expect(isValidCronExpression("0 0 * * *")).toBe(true);
      expect(isValidCronExpression("1,2,3 * * * *")).toBe(true);
      expect(isValidCronExpression("1-5 * * * *")).toBe(true);
    });

    it("should return false for invalid cron expressions", () => {
      expect(isValidCronExpression("")).toBe(false);
      expect(isValidCronExpression("invalid")).toBe(false);
      expect(isValidCronExpression("* * * *")).toBe(false); // 4 fields
      expect(isValidCronExpression("* * * * * *")).toBe(false); // 6 fields
    });
  });

  describe("validateRefreshConfig", () => {
    it("should return valid for manual strategy", () => {
      const config: RefreshConfig = { strategy: "manual" };
      expect(validateRefreshConfig(config)).toEqual({ valid: true });
    });

    it("should validate automatic strategy correctly", () => {
      // Valid config
      expect(
        validateRefreshConfig({
          strategy: "automatic",
          intervalMinutes: 60,
          maxStalenessMinutes: 120,
        })
      ).toEqual({ valid: true });

      // Invalid interval (too low)
      expect(
        validateRefreshConfig({
          strategy: "automatic",
          intervalMinutes: 0,
          maxStalenessMinutes: 120,
        })
      ).toEqual({ valid: false, error: "Interval must be between 1 and 1440 minutes" });

      // Invalid interval (too high)
      expect(
        validateRefreshConfig({
          strategy: "automatic",
          intervalMinutes: 1441,
          maxStalenessMinutes: 1450,
        })
      ).toEqual({ valid: false, error: "Interval must be between 1 and 1440 minutes" });

      // Invalid staleness (less than interval)
      expect(
        validateRefreshConfig({
          strategy: "automatic",
          intervalMinutes: 60,
          maxStalenessMinutes: 30,
        })
      ).toEqual({ valid: false, error: "Max staleness must be >= interval" });
    });

    it("should validate cron strategy correctly", () => {
      // Valid cron
      expect(
        validateRefreshConfig({
          strategy: "cron",
          cronExpression: "0 * * * *",
        })
      ).toEqual({ valid: true });

      // Invalid cron
      expect(
        validateRefreshConfig({
          strategy: "cron",
          cronExpression: "invalid-cron",
        })
      ).toEqual({ valid: false, error: "Invalid cron expression" });
    });
  });

  describe("getViewTemplate", () => {
    it("should return a template if it exists", () => {
      const template = getViewTemplate("daily_execution_count");
      expect(template).toBeDefined();
      expect(template?.id).toBe("daily_execution_count");
      expect(template?.name).toBe("Daily Execution Counts");
    });

    it("should return undefined if the template does not exist", () => {
      const template = getViewTemplate("non_existent_template");
      expect(template).toBeUndefined();
    });
  });

  describe("Constants", () => {
    it("should export COMMON_VIEW_TEMPLATES with items", () => {
      expect(COMMON_VIEW_TEMPLATES.length).toBeGreaterThan(0);
      expect(COMMON_VIEW_TEMPLATES[0]!.id).toBeDefined();
    });

    it("should export DEFAULT_TENANT_VIEW_SETTINGS", () => {
      expect(DEFAULT_TENANT_VIEW_SETTINGS).toBeDefined();
      expect(DEFAULT_TENANT_VIEW_SETTINGS.enableQueryRewriting).toBeDefined();
    });

    it("should export DEFAULT_REFRESH_CONFIGS for all strategies", () => {
      expect(DEFAULT_REFRESH_CONFIGS.manual.strategy).toBe("manual");
      expect(DEFAULT_REFRESH_CONFIGS.automatic.strategy).toBe("automatic");
      expect(DEFAULT_REFRESH_CONFIGS.cron.strategy).toBe("cron");
    });
  });
});
