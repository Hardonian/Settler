import { validateScheduleCron, validateScheduleTimezone } from "@/lib/scheduling/schedule-contract";

describe("schedule-contract", () => {
  describe("validateScheduleCron", () => {
    it("accepts valid 5-field cron expressions", () => {
      expect(validateScheduleCron("0 */6 * * *")).toEqual({ valid: true, errors: [] });
      expect(validateScheduleCron("15 2 1,15 * 1-5")).toEqual({ valid: true, errors: [] });
    });

    it("accepts valid 6-field cron expressions", () => {
      expect(validateScheduleCron("0 0 */2 * * *")).toEqual({ valid: true, errors: [] });
    });

    it("rejects out-of-range fields", () => {
      const invalidMinute = validateScheduleCron("61 0 * * *");
      expect(invalidMinute.valid).toBe(false);
      expect(invalidMinute.errors[0]).toContain("out of bounds");

      const invalidMonth = validateScheduleCron("0 0 * 13 *");
      expect(invalidMonth.valid).toBe(false);
      expect(invalidMonth.errors[0]).toContain("out of bounds");
    });

    it("rejects zero or invalid step values", () => {
      const zeroStep = validateScheduleCron("*/0 * * * *");
      expect(zeroStep.valid).toBe(false);
      expect(zeroStep.errors[0]).toContain("Step must be >= 1");

      const badStep = validateScheduleCron("*/foo * * * *");
      expect(badStep.valid).toBe(false);
      expect(badStep.errors[0]).toContain("Invalid cron token");
    });
  });

  describe("validateScheduleTimezone", () => {
    it("accepts valid timezones", () => {
      expect(validateScheduleTimezone("UTC")).toEqual({ valid: true, errors: [] });
      expect(validateScheduleTimezone("America/New_York")).toEqual({ valid: true, errors: [] });
    });

    it("rejects invalid timezones", () => {
      const invalid = validateScheduleTimezone("Mars/Olympus");
      expect(invalid.valid).toBe(false);
      expect(invalid.errors[0]).toContain("Unsupported timezone");
    });
  });
});
