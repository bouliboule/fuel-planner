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
    expect(emptySessionDraft('strength').mode).toBe('rpe');
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
        indoor: false,
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
        sport: 'strength',
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

  it('reports missing and invalid fields', () => {
    const r = sessionFromDraft(
      base({
        sport: 'pilates',
        mode: 'rpe',
        start: '',
        durationMin: '0',
        rpe: '11',
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(Object.keys(r.errors).sort()).toEqual([
        'durationMin',
        'rpe',
        'start',
      ]);
      expect(r.errors.rpe).toBe('Allowed range: 1 to 10.');
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

describe('seed week template draft', () => {
  it('keeps known values and leaves TODO values empty', async () => {
    const { draftFromSeed, seedStrengthSessions, templateFromDraft } =
      await import('../../src/features/templates/templateDraft.ts');
    const draft = draftFromSeed();
    expect(draft.name).toBe('Standard week');
    expect(draft.sessions.map((s) => s.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    const [monday, , wednesday, , , , sunday] = draft.sessions;
    expect(monday?.mode).toBe('pace');
    expect(monday?.pace).toBe('');
    expect(wednesday?.zone).toBe('SS');
    expect(wednesday?.indoor).toBe(true);
    expect(sunday?.durationMin).toBe('240');
    expect(sunday?.start).toBe('');
    // TODO values block saving until filled.
    expect(templateFromDraft(draft).ok).toBe(false);

    const strength = seedStrengthSessions([1, 3]);
    expect(strength.map((s) => [s.weekday, s.sport, s.durationMin])).toEqual([
      [1, 'strength', '15'],
      [3, 'strength', '15'],
    ]);
  });
});
