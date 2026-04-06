import { validateScheduleCron, validateScheduleTimezone } from '@/lib/scheduling/schedule-contract';

describe('schedule contract validation', () => {
  it('accepts null cron (unscheduled)', () => {
    expect(validateScheduleCron(null)).toEqual({ valid: true, errors: [] });
  });

  it('rejects malformed cron field counts', () => {
    const result = validateScheduleCron('0 0 * *');
    expect(result.valid).toBe(false);
  });

  it('rejects invalid cron token characters', () => {
    const result = validateScheduleCron('0 0 * * MONDAY!');
    expect(result.valid).toBe(false);
  });

  it('accepts valid timezone and rejects invalid timezone', () => {
    expect(validateScheduleTimezone('UTC').valid).toBe(true);
    expect(validateScheduleTimezone('Not/A_Zone').valid).toBe(false);
  });
});
