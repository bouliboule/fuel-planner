import { describe, expect, it } from 'vitest';
import { addDays, goalOn, monthOf, monthWeeks } from '../../src/app/dates.ts';

describe('addDays', () => {
  it('adds days across months and years', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('goalOn', () => {
  const goals = [{ validFrom: '2026-11-01' }, { validFrom: '2026-10-01' }];

  it('takes the latest goal starting on or before the date', () => {
    expect(goalOn(goals, '2026-11-04')?.validFrom).toBe('2026-11-01');
    expect(goalOn(goals, '2026-10-31')?.validFrom).toBe('2026-10-01');
  });

  it('takes the earliest goal for dates before any goal', () => {
    expect(goalOn(goals, '2026-09-01')?.validFrom).toBe('2026-10-01');
  });

  it('returns undefined with no goals', () => {
    expect(goalOn<{ validFrom: string }>([], '2026-11-04')).toBeUndefined();
  });
});

describe('calendar months', () => {
  it('steps months across years', () => {
    expect(monthOf('2026-11-04')).toBe('2026-11');
    expect(monthOf('2026-11-04', 2)).toBe('2027-01');
    expect(monthOf('2026-01-31', -1)).toBe('2025-12');
  });

  it('lays out November 2026 Monday to Sunday', () => {
    // 1 November 2026 is a Sunday: the first week starts Monday 26 October.
    // 30 November is a Monday: the last week ends Sunday 6 December.
    const weeks = monthWeeks('2026-11');
    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.[0]).toBe('2026-10-26');
    expect(weeks[0]?.[6]).toBe('2026-11-01');
    expect(weeks[5]?.[0]).toBe('2026-11-30');
    expect(weeks[5]?.[6]).toBe('2026-12-06');
  });

  it('needs only four weeks for February 2027', () => {
    // 1 February 2027 is a Monday and February has 28 days.
    const weeks = monthWeeks('2027-02');
    expect(weeks).toHaveLength(4);
    expect(weeks[3]?.[6]).toBe('2027-02-28');
  });
});
