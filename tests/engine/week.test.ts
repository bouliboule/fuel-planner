import { describe, expect, it } from 'vitest';
import {
  addDays,
  isoWeekday,
  sessionsFromTemplate,
  weekDates,
  weekSummary,
} from '../../src/engine/week.ts';
import type { Goal } from '../../src/model/index.ts';
import { maintain, session, testProfile } from './fixtures.ts';

describe('week dates', () => {
  it('numbers weekdays 1 = Monday to 7 = Sunday', () => {
    expect(isoWeekday('2026-11-02')).toBe(1); // Monday
    expect(isoWeekday('2026-11-08')).toBe(7); // Sunday
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('lists Monday to Sunday of the week containing a date', () => {
    expect(weekDates('2026-11-04')).toEqual([
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-07',
      '2026-11-08',
    ]);
    expect(weekDates('2026-11-08')[0]).toBe('2026-11-02');
    expect(weekDates('2027-01-01')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });
});

describe('template to dated sessions', () => {
  it('places each session on its weekday of the week', () => {
    const sessions = sessionsFromTemplate(
      {
        name: 'Standard',
        sessions: [
          {
            weekday: 1,
            sport: 'run',
            start: '18:00',
            durationMin: 60,
            indoor: false,
            key: true,
            intensity: { kind: 'pace', secPerKm: 300 },
          },
          {
            weekday: 7,
            sport: 'ride',
            start: '09:30',
            durationMin: 240,
            indoor: false,
            key: true,
            intensity: { kind: 'zone', zone: 'Z2' },
          },
        ],
      },
      'tpl-1',
      '2026-11-04',
    );
    expect(
      sessions.map((s) => [s.date, s.sport, s.source, s.templateId]),
    ).toEqual([
      ['2026-11-02', 'run', 'template', 'tpl-1'],
      ['2026-11-08', 'ride', 'template', 'tpl-1'],
    ]);
    expect(sessions[0]).not.toHaveProperty('weekday');
  });
});

describe('week summary', () => {
  // Day targets from the M1 fixtures (test profile, 75 kg, maintain):
  // rest 2296.6875 kcal, 3 g/kg; Monday run 3196.6875 kcal, 450 / 75 = 6 g/kg;
  // Sunday Z2 240 min 4626.993427 kcal, 750 / 75 = 10 g/kg.
  const dates = weekDates('2026-11-04');
  const days = weekSummary({
    dates,
    profile: testProfile,
    goals: [maintain],
    sessions: [
      session({
        id: 'mon',
        date: '2026-11-02',
        sport: 'run',
        durationMin: 60,
        intensity: { kind: 'pace', secPerKm: 300 },
        key: true,
      }),
      session({
        id: 'sun',
        date: '2026-11-08',
        start: '09:30',
        sport: 'ride',
        durationMin: 240,
        intensity: { kind: 'zone', zone: 'Z2' },
        key: true,
      }),
    ],
  });

  it('has one row per day with its sessions', () => {
    expect(days.map((d) => d.date)).toEqual(dates);
    expect(days[0]?.sessions.map((s) => s.id)).toEqual(['mon']);
    expect(days[1]?.sessions).toEqual([]);
  });

  it('matches the fixture day targets', () => {
    expect(days[0]?.targetKcal).toBeCloseTo(3196.6875, 4);
    expect(days[0]?.carbGPerKg).toBeCloseTo(6, 6);
    expect(days[1]?.targetKcal).toBeCloseTo(2296.6875, 4);
    expect(days[1]?.carbGPerKg).toBeCloseTo(3, 6);
    expect(days[1]?.load).toBe('rest');
    expect(days[6]?.targetKcal).toBeCloseTo(4626.993427, 4);
    expect(days[6]?.carbGPerKg).toBeCloseTo(10, 6);
  });

  it('uses the goal in force on each date', () => {
    // From Wednesday, lose 0.3 kg/week: rest days get -0.3 * 7700 / 7 = -330
    const goals: Goal[] = [
      maintain,
      { kind: 'lose', rateKgPerWeek: 0.3, validFrom: '2026-11-04' },
    ];
    const r = weekSummary({ dates, profile: testProfile, goals, sessions: [] });
    expect(r[1]?.targetKcal).toBeCloseTo(2296.6875, 4); // Tuesday, maintain
    expect(r[2]?.targetKcal).toBeCloseTo(1966.6875, 4); // Wednesday, lose
  });

  it('uses the earliest goal before any goal starts', () => {
    const goals: Goal[] = [
      { kind: 'lose', rateKgPerWeek: 0.3, validFrom: '2026-11-06' },
    ];
    const r = weekSummary({ dates, profile: testProfile, goals, sessions: [] });
    expect(r[0]?.targetKcal).toBeCloseTo(1966.6875, 4);
  });
});
