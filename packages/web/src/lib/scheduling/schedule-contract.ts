export interface ScheduleValidationResult {
  valid: boolean;
  errors: string[];
}

const CRON_FIELD_REGEX = /^[0-9*/,\-]+$/;
const CRON_RANGES_FIVE_FIELDS: ReadonlyArray<{ min: number; max: number; label: string }> = [
  { min: 0, max: 59, label: "minute" },
  { min: 0, max: 23, label: "hour" },
  { min: 1, max: 31, label: "day_of_month" },
  { min: 1, max: 12, label: "month" },
  { min: 0, max: 7, label: "day_of_week" },
];

const CRON_RANGES_SIX_FIELDS: ReadonlyArray<{ min: number; max: number; label: string }> = [
  { min: 0, max: 59, label: "second" },
  ...CRON_RANGES_FIVE_FIELDS,
];

function isValidInteger(input: string): boolean {
  return /^\d+$/.test(input);
}

function validateCronRangeToken(
  token: string,
  min: number,
  max: number
): { valid: boolean; message?: string } {
  const [startRaw, endRaw] = token.split("-");
  if (!startRaw || !endRaw || !isValidInteger(startRaw) || !isValidInteger(endRaw)) {
    return { valid: false, message: `Invalid range token: ${token}` };
  }
  const start = Number(startRaw);
  const end = Number(endRaw);
  if (start < min || end > max || start > end) {
    return { valid: false, message: `Range ${token} is out of bounds (${min}-${max})` };
  }
  return { valid: true };
}

function validateCronAtom(
  atom: string,
  min: number,
  max: number
): { valid: boolean; message?: string } {
  if (atom === "*") {
    return { valid: true };
  }

  if (atom.includes("-")) {
    return validateCronRangeToken(atom, min, max);
  }

  if (!isValidInteger(atom)) {
    return { valid: false, message: `Invalid cron token: ${atom}` };
  }

  const value = Number(atom);
  if (value < min || value > max) {
    return { valid: false, message: `Value ${atom} is out of bounds (${min}-${max})` };
  }

  return { valid: true };
}

function validateCronSegment(
  fieldValue: string,
  min: number,
  max: number,
  label: string
): { valid: boolean; message?: string } {
  const parts = fieldValue.split(",");
  for (const part of parts) {
    if (!part) {
      return { valid: false, message: `Invalid ${label} token: empty segment` };
    }

    const [base, stepRaw] = part.split("/");
    if (!base) {
      return { valid: false, message: `Invalid ${label} token: ${part}` };
    }

    if (stepRaw !== undefined) {
      if (!isValidInteger(stepRaw)) {
        return { valid: false, message: `Invalid step in ${label}: ${part}` };
      }
      const step = Number(stepRaw);
      if (step < 1) {
        return { valid: false, message: `Step must be >= 1 in ${label}: ${part}` };
      }
    }

    const baseValidation = validateCronAtom(base, min, max);
    if (!baseValidation.valid) {
      return baseValidation;
    }
  }

  return { valid: true };
}

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

  const fieldBounds = parts.length === 6 ? CRON_RANGES_SIX_FIELDS : CRON_RANGES_FIVE_FIELDS;
  for (let i = 0; i < parts.length; i += 1) {
    const bounds = fieldBounds[i];
    if (!bounds) continue;
    const part = parts[i];
    if (!part) continue;
    const validation = validateCronSegment(part, bounds.min, bounds.max, bounds.label);
    if (!validation.valid) {
      return { valid: false, errors: [validation.message || "Invalid cron expression."] };
    }
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
