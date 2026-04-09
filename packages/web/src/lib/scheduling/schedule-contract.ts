export interface ScheduleValidationResult {
  valid: boolean;
  errors: string[];
}

const CRON_FIELD_REGEX = /^[0-9*/,\-]+$/;

export function validateScheduleCron(cron: string | null | undefined): ScheduleValidationResult {
  if (cron === null || cron === undefined || cron.trim().length === 0) {
    return { valid: true, errors: [] };
  }

  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) {
    return {
      valid: false,
      errors: ["Invalid cron expression. Expected 5 or 6 fields."],
    };
  }

  const invalidToken = parts.find((part) => !CRON_FIELD_REGEX.test(part));
  if (invalidToken) {
    return {
      valid: false,
      errors: [`Invalid cron token: ${invalidToken}`],
    };
  }

  return { valid: true, errors: [] };
}

export function validateScheduleTimezone(
  timezone: string | null | undefined
): ScheduleValidationResult {
  if (!timezone || timezone.trim().length === 0) {
    return { valid: false, errors: ["Timezone is required when schedule is configured."] };
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return { valid: true, errors: [] };
  } catch {
    return { valid: false, errors: [`Unsupported timezone: ${timezone}`] };
  }
}
