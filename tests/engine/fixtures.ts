import type { PlannedSession } from '../../src/engine/types.ts';
import type { Goal, Profile } from '../../src/model/index.ts';

// Test profile. Age (birth year 1989, so 37 in 2026) and height are the
// user's; sex, mass, FTP and times are labelled test values.
export const testProfile: Profile = {
  sex: 'male', // test value
  birthYear: 1989,
  heightCm: 181,
  massKg: 75, // test value
  ftpW: 250, // test value
  timeZone: 'Europe/Paris',
  wakeTime: '07:00', // test value
  sleepTime: '23:00', // test value
  usualMeals: [
    { name: 'Breakfast', time: '07:30' },
    { name: 'Lunch', time: '12:30' },
    { name: 'Dinner', time: '19:30' },
  ],
  neaFactor: 1.35,
  grossEfficiency: 0.24,
  proteinGPerKg: 1.8,
  carbPointInRange: 0.5,
};

export const maintain: Goal = { kind: 'maintain', validFrom: '2026-01-01' };

export function session(
  overrides: Partial<PlannedSession> &
    Pick<PlannedSession, 'sport' | 'durationMin' | 'intensity'>,
): PlannedSession {
  return {
    id: 's1',
    date: '2026-11-02',
    start: '18:00',
    key: false,
    ...overrides,
  };
}

// The test profile without FTP: rides fall back to compendium effort codes.
export const noFtpProfile: Profile = { ...testProfile };
delete noFtpProfile.ftpW;
