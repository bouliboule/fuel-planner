import { describe, expect, it } from 'vitest';
import { backToBackWarnings, hardKind } from '../../src/engine/backToBack.ts';
import type { PlannedSession } from '../../src/engine/types.ts';
import type { Profile } from '../../src/model/index.ts';
import { noFtpProfile, session, testProfile } from './fixtures.ts';

const ride = (patch: Partial<PlannedSession> = {}) =>
  session({
    sport: 'ride',
    durationMin: 90,
    intensity: { kind: 'zone', zone: 'Z4' },
    ...patch,
  });
const run = (patch: Partial<PlannedSession> = {}) =>
  session({
    sport: 'run',
    durationMin: 50,
    intensity: { kind: 'pace', secPerKm: 300 },
    ...patch,
  });

describe('D52 hard ride and hard run', () => {
  it.each([
    ['Z2', false],
    ['Z3', false],
    ['SS', true],
    ['Z4', true],
    ['Z5', true],
  ] as const)('ride in %s is hard: %s', (zone, hard) => {
    expect(
      hardKind(ride({ intensity: { kind: 'zone', zone } }), testProfile),
    ).toBe(hard ? 'ride' : undefined);
  });

  it('counts a key ride as hard whatever its zone', () => {
    expect(
      hardKind(
        ride({ key: true, intensity: { kind: 'zone', zone: 'Z2' } }),
        testProfile,
      ),
    ).toBe('ride');
  });

  it('uses the M2 band for a kJ ride', () => {
    // FTP 250, 60 min, 900 kJ: 900000 / 3600 = 250 W, IF 1.0 -> Z4 -> high
    expect(
      hardKind(
        ride({ durationMin: 60, intensity: { kind: 'kj', value: 900 } }),
        testProfile,
      ),
    ).toBe('ride');
    // Without FTP a zone still maps to its band.
    expect(hardKind(ride(), noFtpProfile)).toBe('ride');
  });

  it.each([
    [undefined, false],
    ['easy', false],
    ['intervals', true],
    ['hard-long', true],
  ] as const)('run of type %s is hard: %s', (runType, hard) => {
    expect(hardKind(run(runType ? { runType } : {}), testProfile)).toBe(
      hard ? 'run' : undefined,
    );
  });

  it('ignores the key flag and pace for runs', () => {
    // A 5:00/km run is high in M2 and key, but its type is easy.
    expect(hardKind(run({ key: true, runType: 'easy' }), testProfile)).toBe(
      undefined,
    );
  });

  it('never counts other sports', () => {
    expect(
      hardKind(
        session({
          sport: 'strength',
          durationMin: 30,
          key: true,
          intensity: { kind: 'effort', value: 'hard' },
        }),
        testProfile,
      ),
    ).toBe(undefined);
  });
});

describe('D53 back-to-back warning', () => {
  const check = (
    s: PlannedSession,
    around: { before?: PlannedSession[]; after?: PlannedSession[] },
    profile: Profile = testProfile,
  ) =>
    backToBackWarnings({
      session: s,
      dayBefore: around.before ?? [],
      dayAfter: around.after ?? [],
      profile,
    }).map((w) => w.code);

  it('warns for a hard ride after a hard ride', () => {
    expect(
      check(ride({ id: 'b' }), { before: [ride({ id: 'a', key: true })] }),
    ).toEqual(['back-to-back-ride-before']);
  });

  it('warns on both sides', () => {
    expect(
      check(ride({ id: 'b' }), {
        before: [ride({ id: 'a' })],
        after: [ride({ id: 'c', intensity: { kind: 'zone', zone: 'Z5' } })],
      }),
    ).toEqual(['back-to-back-ride-before', 'back-to-back-ride-after']);
  });

  it('does not warn for an easy ride or across sports', () => {
    expect(
      check(ride({ intensity: { kind: 'zone', zone: 'Z2' } }), {
        before: [ride({ id: 'a' })],
      }),
    ).toEqual([]);
    expect(
      check(run({ runType: 'intervals' }), { before: [ride({ id: 'a' })] }),
    ).toEqual([]);
  });

  it('warns for a hard run next to a hard run, not an easy one', () => {
    expect(
      check(run({ runType: 'intervals' }), {
        after: [run({ id: 'x', runType: 'hard-long' })],
      }),
    ).toEqual(['back-to-back-run-after']);
    expect(
      check(run({ runType: 'easy' }), {
        before: [run({ id: 'x', runType: 'intervals' })],
      }),
    ).toEqual([]);
  });

  it('stays quiet when the profile allows it', () => {
    const rides: Profile = { ...testProfile, allowBackToBackHardRides: true };
    expect(
      check(ride({ id: 'b' }), { before: [ride({ id: 'a' })] }, rides),
    ).toEqual([]);
    // Allowing rides does not allow runs.
    expect(
      check(
        run({ runType: 'intervals' }),
        {
          before: [run({ id: 'x', runType: 'intervals' })],
        },
        rides,
      ),
    ).toEqual(['back-to-back-run-before']);
    const runs: Profile = { ...testProfile, allowBackToBackHardRuns: true };
    expect(
      check(
        run({ runType: 'intervals' }),
        {
          before: [run({ id: 'x', runType: 'intervals' })],
        },
        runs,
      ),
    ).toEqual([]);
  });

  it('carries the session id for the card', () => {
    const [w] = backToBackWarnings({
      session: ride({ id: 'b' }),
      dayBefore: [ride({ id: 'a' })],
      dayAfter: [],
      profile: testProfile,
    });
    expect(w).toEqual({
      code: 'back-to-back-ride-before',
      ruleId: 'D53',
      values: { sessionId: 'b' },
    });
  });
});
