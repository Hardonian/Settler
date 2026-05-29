import {
  RefreshStrategySchema,
  isValidCronExpression,
  validateRefreshConfig,
  getViewTemplate,
  DEFAULT_TENANT_VIEW_SETTINGS,
  DEFAULT_REFRESH_CONFIGS,
  RefreshConfig,
} from "../../infrastructure/MaterializedViewConfig";

describe("MaterializedViewConfig", () => {
  describe("RefreshStrategySchema", () => {
    it("should accept valid strategies", () => {
      expect(RefreshStrategySchema.safeParse("manual").success).toBe(true);
      expect(RefreshStrategySchema.safeParse("automatic").success).toBe(true);
      expect(RefreshStrategySchema.safeParse("cron").success).toBe(true);
    });

    it("should reject invalid strategies", () => {
      expect(RefreshStrategySchema.safeParse("invalid").success).toBe(false);
      expect(RefreshStrategySchema.safeParse("").success).toBe(false);
      expect(RefreshStrategySchema.safeParse(null).success).toBe(false);
    });
  });

  describe("isValidCronExpression", () => {
    it("should return true for valid cron expressions", () => {
      expect(isValidCronExpression("* * * * *")).toBe(true);
      expect(isValidCronExpression("0 * * * *")).toBe(true);
      expect(isValidCronExpression("0 0 * * *")).toBe(true);
      expect(isValidCronExpression("*/15 * * * *")).toBe(true);
      expect(isValidCronExpression("0 12 * * 1-5")).toBe(true);
      expect(isValidCronExpression("0 0 1,15 * *")).toBe(true);
    });

    it("should return false for invalid cron expressions", () => {
      expect(isValidCronExpression("invalid")).toBe(false);
      expect(isValidCronExpression("* * * *")).toBe(false); // too few parts
      expect(isValidCronExpression("* * * * * *")).toBe(false); // too many parts
      expect(isValidCronExpression("")).toBe(false);
    });
  });

  describe("validateRefreshConfig", () => {
    it("should validate manual strategy", () => {
      const config: RefreshConfig = { strategy: "manual" };
      expect(validateRefreshConfig(config)).toEqual({ valid: true });
    });

    it("should validate automatic strategy correctly", () => {
      const validConfig: RefreshConfig = {
        strategy: "automatic",
        intervalMinutes: 60,
        maxStalenessMinutes: 120,
      };
      expect(validateRefreshConfig(validConfig)).toEqual({ valid: true });
    });

    it("should reject automatic strategy with invalid interval", () => {
      const invalidConfig1: RefreshConfig = {
        strategy: "automatic",
        intervalMinutes: 0,
        maxStalenessMinutes: 120,
      };
      expect(validateRefreshConfig(invalidConfig1)).toEqual({
        valid: false,
        error: "Interval must be between 1 and 1440 minutes",
      });

      const invalidConfig2: RefreshConfig = {
        strategy: "automatic",
        intervalMinutes: 1500,
        maxStalenessMinutes: 1600,
      };
      expect(validateRefreshConfig(invalidConfig2)).toEqual({
        valid: false,
        error: "Interval must be between 1 and 1440 minutes",
      });
    });

    it("should reject automatic strategy with maxStalenessMinutes less than intervalMinutes", () => {
      const invalidConfig: RefreshConfig = {
        strategy: "automatic",
        intervalMinutes: 60,
        maxStalenessMinutes: 30,
      };
      expect(validateRefreshConfig(invalidConfig)).toEqual({
        valid: false,
        error: "Max staleness must be >= interval",
      });
    });

    it("should validate cron strategy correctly", () => {
      const validConfig: RefreshConfig = { strategy: "cron", cronExpression: "0 * * * *" };
      expect(validateRefreshConfig(validConfig)).toEqual({ valid: true });
    });

    it("should reject cron strategy with invalid cron expression", () => {
      const invalidConfig: RefreshConfig = { strategy: "cron", cronExpression: "invalid" };
      expect(validateRefreshConfig(invalidConfig)).toEqual({
        valid: false,
        error: "Invalid cron expression",
      });
    });
  });

  describe("getViewTemplate", () => {
    it("should return correct template by id", () => {
      const template = getViewTemplate("daily_execution_count");
      expect(template).toBeDefined();
      expect(template?.id).toBe("daily_execution_count");
      expect(template?.name).toBe("Daily Execution Counts");
    });

    it("should return undefined for non-existent template", () => {
      expect(getViewTemplate("non_existent_id")).toBeUndefined();
    });
  });

  describe("Default Configurations", () => {
    it("should have correct DEFAULT_TENANT_VIEW_SETTINGS", () => {
      expect(DEFAULT_TENANT_VIEW_SETTINGS).toBeDefined();
      expect(DEFAULT_TENANT_VIEW_SETTINGS.enableQueryRewriting).toBe(true);
      expect(DEFAULT_TENANT_VIEW_SETTINGS.allowStaleData).toBe(false);
      expect(DEFAULT_TENANT_VIEW_SETTINGS.preferIncrementalRefresh).toBe(true);
    });

    it("should have correct DEFAULT_REFRESH_CONFIGS", () => {
      expect(DEFAULT_REFRESH_CONFIGS).toBeDefined();
      expect(DEFAULT_REFRESH_CONFIGS.manual.strategy).toBe("manual");
      expect(DEFAULT_REFRESH_CONFIGS.automatic.strategy).toBe("automatic");
      expect(DEFAULT_REFRESH_CONFIGS.cron.strategy).toBe("cron");

      // type narrowing check
      if (DEFAULT_REFRESH_CONFIGS.cron.strategy === "cron") {
        expect(DEFAULT_REFRESH_CONFIGS.cron.cronExpression).toBe("0 * * * *");
      }
    });
  });
});
