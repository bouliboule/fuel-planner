import { describe, expect, it } from 'vitest';
import {
  draftFromSession,
  emptySessionDraft,
  formatPace,
  parsePace,
  sessionFromDraft,
  type SessionDraft,
} from '../../src/features/sessions/sessionDraft.ts';

const base = (patch: Partial<SessionDraft>): SessionDraft => ({
  ...emptySessionDraft(patch.sport ?? 'ride'),
  start: '18:00',
  durationMin: '60',
  ...patch,
});

describe('pace', () => {
  it('parses and formats m:ss per km', () => {
    expect(parsePace('5:00')).toBe(300);
    expect(parsePace('4:35')).toBe(275);
    expect(parsePace('5:60')).toBeUndefined();
    expect(parsePace('fast')).toBeUndefined();
    expect(formatPace(300)).toBe('5:00');
    expect(formatPace(275.4)).toBe('4:35');
  });
});

describe('session draft', () => {
  it('defaults the intensity mode by sport', () => {
    expect(emptySessionDraft('ride').mode).toBe('zone');
    expect(emptySessionDraft('run').mode).toBe('pace');
    expect(emptySessionDraft('strength').mode).toBe('effort');
    expect(emptySessionDraft('walk').mode).toBe('met');
  });

  it('builds a zone ride', () => {
    const r = sessionFromDraft(
      base({ sport: 'ride', mode: 'zone', zone: 'SS', key: true }),
    );
    expect(r).toEqual({
      ok: true,
      session: {
        sport: 'ride',
        start: '18:00',
        durationMin: 60,
        key: true,
        intensity: { kind: 'zone', zone: 'SS' },
      },
    });
  });

  it('builds a run from pace', () => {
    const r = sessionFromDraft(
      base({ sport: 'run', mode: 'pace', pace: '5:00' }),
    );
    expect(r.ok && r.session.intensity).toEqual({
      kind: 'pace',
      secPerKm: 300,
    });
    expect(r.ok && r.session.runType).toBe('easy');
  });

  it('keeps the run type for runs only (D52)', () => {
    const r = sessionFromDraft(
      base({ sport: 'run', pace: '4:30', runType: 'intervals' }),
    );
    expect(r.ok && r.session.runType).toBe('intervals');
    const ride = sessionFromDraft(
      base({ sport: 'ride', runType: 'intervals' }),
    );
    expect(ride.ok && 'runType' in ride.session).toBe(false);
  });

  it('builds a run from distance with the implied pace', () => {
    // 50 min * 60 = 3000 s; 3000 / 10 km = 300 s/km
    const r = sessionFromDraft(
      base({
        sport: 'run',
        mode: 'distance',
        durationMin: '50',
        distanceKm: '10',
      }),
    );
    expect(r.ok && r.session.intensity).toEqual({
      kind: 'pace',
      secPerKm: 300,
    });
    expect(r.ok && r.session.distanceKm).toBe(10);
  });

  it('keeps an explicit MET and compendium code', () => {
    const r = sessionFromDraft(
      base({
        sport: 'other',
        mode: 'met',
        met: '5',
        compendiumCode: '02035',
      }),
    );
    expect(r.ok && r.session.intensity).toEqual({
      kind: 'met',
      value: 5,
      compendiumCode: '02035',
    });
  });

  it('builds Pilates from an effort', () => {
    const r = sessionFromDraft(base({ sport: 'pilates', effort: 'hard' }));
    expect(r.ok && r.session.intensity).toEqual({
      kind: 'effort',
      value: 'hard',
    });
  });

  it('opens a stored RPE strength session as the effort of its band', () => {
    // M2: RPE under 4 low, 4 to 6 moderate, 7 or more high (D44)
    const d = (value: number) =>
      draftFromSession({
        sport: 'strength',
        start: '07:00',
        durationMin: 15,
        key: false,
        intensity: { kind: 'rpe', value },
      }).effort;
    expect([d(3), d(4), d(6.5), d(7)]).toEqual([
      'easy',
      'moderate',
      'moderate',
      'hard',
    ]);
  });

  it('reports missing and invalid fields', () => {
    const r = sessionFromDraft(
      base({
        sport: 'walk',
        start: '',
        durationMin: '0',
        met: '',
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual([
        'durationMin',
        'met',
        'start',
      ]);
      expect(r.errors.met).toBe('Required.');
    }
  });

  it('round-trips through the draft', () => {
    const r = sessionFromDraft(
      base({
        sport: 'run',
        mode: 'distance',
        durationMin: '45',
        distanceKm: '9',
        title: 'Tempo',
      }),
    );
    if (!r.ok) throw new Error('invalid');
    const again = sessionFromDraft(draftFromSession(r.session));
    expect(again).toEqual(r);
  });
});
