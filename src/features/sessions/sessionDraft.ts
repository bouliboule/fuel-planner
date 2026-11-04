import { RPE_HIGH_MIN, RPE_MODERATE_MIN } from '../../engine/constants.ts';
import { t } from '../../i18n/index.ts';
import {
  sessionSchema,
  zoneSchema,
  type Effort,
  type Session,
  type Sport,
  type Zone,
} from '../../model/index.ts';
import { parseNumber } from '../../ui/parse.ts';

export type IntensityMode =
  'zone' | 'kj' | 'pace' | 'distance' | 'effort' | 'met';

/**
 * Intensity inputs offered per sport (D44). The first is shown; the others
 * sit under "More".
 */
export const MODES_BY_SPORT: Readonly<Record<Sport, readonly IntensityMode[]>> =
  {
    ride: ['zone', 'kj'],
    run: ['pace', 'distance'],
    pilates: ['effort'],
    strength: ['effort'],
    walk: ['met'],
    other: ['met'],
  };

/** Activity fields as typed; numbers stay strings until saved. */
export interface SessionDraft {
  sport: Sport;
  title: string;
  start: string;
  durationMin: string;
  key: boolean;
  mode: IntensityMode;
  zone: Zone;
  kj: string;
  pace: string;
  distanceKm: string;
  effort: Effort;
  met: string;
  compendiumCode: string;
}

export type SessionFields = Omit<Session, 'date'>;
export type SessionField =
  'start' | 'durationMin' | 'kj' | 'pace' | 'distanceKm' | 'met';
export type SessionErrors = Partial<Record<SessionField, string>>;

export function emptySessionDraft(sport: Sport = 'ride'): SessionDraft {
  return {
    sport,
    title: '',
    start: '',
    durationMin: '',
    key: false,
    mode: MODES_BY_SPORT[sport][0] ?? 'met',
    zone: 'Z2',
    kj: '',
    pace: '',
    distanceKm: '',
    effort: 'moderate',
    met: '',
    compendiumCode: '',
  };
}

/** Pace 'm:ss' per km to seconds per km. */
export function parsePace(text: string): number | undefined {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim());
  if (!match) return undefined;
  const seconds = Number(match[1]) * 60 + Number(match[2]);
  return seconds > 0 ? seconds : undefined;
}

export function formatPace(secPerKm: number): string {
  const total = Math.round(secPerKm);
  return `${String(Math.floor(total / 60))}:${String(total % 60).padStart(2, '0')}`;
}

/** RPE to the effort with the same M2 band (DOMAIN M2 table). */
function effortFromRpe(rpe: number): Effort {
  if (rpe < RPE_MODERATE_MIN) return 'easy';
  if (rpe < RPE_HIGH_MIN) return 'moderate';
  return 'hard';
}

export function draftFromSession(s: SessionFields): SessionDraft {
  const base: SessionDraft = {
    ...emptySessionDraft(s.sport),
    title: s.title ?? '',
    start: s.start,
    durationMin: String(s.durationMin),
    key: s.key,
  };
  const i = s.intensity;
  switch (i.kind) {
    case 'zone':
      return { ...base, mode: 'zone', zone: i.zone };
    case 'kj':
      return { ...base, mode: 'kj', kj: String(i.value) };
    case 'effort':
      return { ...base, mode: 'effort', effort: i.value };
    case 'rpe':
      // Pilates and strength keep their band; a ride by RPE has no editable
      // equivalent and opens on the zone input.
      return s.sport === 'pilates' || s.sport === 'strength'
        ? { ...base, mode: 'effort', effort: effortFromRpe(i.value) }
        : { ...base, mode: 'zone' };
    case 'met':
      return {
        ...base,
        mode: 'met',
        met: String(i.value),
        compendiumCode: i.compendiumCode ?? '',
      };
    case 'pace':
      return s.distanceKm === undefined
        ? { ...base, mode: 'pace', pace: formatPace(i.secPerKm) }
        : { ...base, mode: 'distance', distanceKm: String(s.distanceKm) };
    case 'if':
      // No IF input in the form; keep the nearest editable mode.
      return { ...base, mode: 'zone' };
  }
}

/**
 * Validates the draft. A run entered by distance stores that distance and
 * the pace it implies, duration / distance (D28).
 */
export function sessionFromDraft(
  draft: SessionDraft,
): { ok: true; session: SessionFields } | { ok: false; errors: SessionErrors } {
  const errors: SessionErrors = {};
  const durationMin = parseNumber(draft.durationMin);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(draft.start)) {
    errors.start = draft.start === '' ? t('form.required') : t('form.check');
  }
  if (durationMin === undefined) errors.durationMin = t('form.required');
  else if (!(durationMin > 0)) errors.durationMin = t('form.check');

  const positive = (field: SessionField, text: string) => {
    const n = parseNumber(text);
    if (n === undefined) errors[field] = t('form.required');
    else if (!(n > 0)) errors[field] = t('form.check');
    return n;
  };

  let intensity: Session['intensity'] | undefined;
  let distanceKm: number | undefined;
  switch (draft.mode) {
    case 'zone':
      intensity = { kind: 'zone', zone: zoneSchema.parse(draft.zone) };
      break;
    case 'kj': {
      const value = positive('kj', draft.kj);
      if (value !== undefined) intensity = { kind: 'kj', value };
      break;
    }
    case 'effort':
      intensity = { kind: 'effort', value: draft.effort };
      break;
    case 'met': {
      const value = positive('met', draft.met);
      const code = draft.compendiumCode.trim();
      if (value !== undefined) {
        intensity = {
          kind: 'met',
          value,
          ...(code ? { compendiumCode: code } : {}),
        };
      }
      break;
    }
    case 'pace': {
      const secPerKm = parsePace(draft.pace);
      if (secPerKm === undefined) {
        errors.pace =
          draft.pace.trim() === '' ? t('form.required') : t('form.check');
      } else {
        intensity = { kind: 'pace', secPerKm };
      }
      break;
    }
    case 'distance': {
      distanceKm = positive('distanceKm', draft.distanceKm);
      if (
        distanceKm !== undefined &&
        durationMin !== undefined &&
        durationMin > 0
      ) {
        intensity = { kind: 'pace', secPerKm: (durationMin * 60) / distanceKm };
      }
      break;
    }
  }

  if (
    Object.keys(errors).length > 0 ||
    !intensity ||
    durationMin === undefined
  ) {
    return { ok: false, errors };
  }
  const title = draft.title.trim();
  const session: SessionFields = {
    sport: draft.sport,
    start: draft.start,
    durationMin,
    key: draft.key,
    intensity,
    ...(distanceKm === undefined ? {} : { distanceKm }),
    ...(title ? { title } : {}),
  };
  // Same rules as storage, without the date.
  const parsed = sessionSchema.omit({ date: true }).safeParse(session);
  if (!parsed.success)
    return { ok: false, errors: { durationMin: t('form.check') } };
  return { ok: true, session: parsed.data };
}
