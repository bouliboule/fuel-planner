import { describe, expect, it } from 'vitest';
import { addDays, goalOn } from '../../src/app/dates.ts';

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
