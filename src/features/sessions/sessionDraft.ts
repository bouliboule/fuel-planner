import { t } from '../../i18n/index.ts';
import {
  sessionSchema,
  zoneSchema,
  type Session,
  type Sport,
  type Zone,
} from '../../model/index.ts';
import { parseNumber } from '../../ui/parse.ts';

export type IntensityMode = 'zone' | 'kj' | 'rpe' | 'pace' | 'distance' | 'met';

/** Intensity inputs offered per sport (DECISIONS D28). First is the default. */
export const MODES_BY_SPORT: Readonly<Record<Sport, readonly IntensityMode[]>> =
  {
    ride: ['zone', 'kj', 'rpe'],
    run: ['pace', 'distance'],
    pilates: ['rpe', 'met'],
    strength: ['rpe', 'met'],
    walk: ['met'],
    other: ['met'],
  };

/** Session fields as typed; numbers stay strings until saved. */
export interface SessionDraft {
  sport: Sport;
  title: string;
  start: string;
  durationMin: string;
  indoor: boolean;
  key: boolean;
  mode: IntensityMode;
  zone: Zone;
  kj: string;
  rpe: string;
  pace: string;
  distanceKm: string;
  met: string;
  compendiumCode: string;
}

export type SessionFields = Omit<Session, 'date' | 'source' | 'templateId'>;
export type SessionField =
  'start' | 'durationMin' | 'kj' | 'rpe' | 'pace' | 'distanceKm' | 'met';
export type SessionErrors = Partial<Record<SessionField, string>>;

export function emptySessionDraft(sport: Sport = 'ride'): SessionDraft {
  return {
    sport,
    title: '',
    start: '',
    durationMin: '',
    indoor: false,
    key: false,
    mode: MODES_BY_SPORT[sport][0] ?? 'met',
    zone: 'Z2',
    kj: '',
    rpe: '',
    pace: '',
    distanceKm: '',
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

export function draftFromSession(s: SessionFields): SessionDraft {
  const d = emptySessionDraft(s.sport);
  const base: SessionDraft = {
    ...d,
    title: s.title ?? '',
    start: s.start,
    durationMin: String(s.durationMin),
    indoor: s.indoor,
    key: s.key,
  };
  const i = s.intensity;
  switch (i.kind) {
    case 'zone':
      return { ...base, mode: 'zone', zone: i.zone };
    case 'kj':
      return { ...base, mode: 'kj', kj: String(i.value) };
    case 'rpe':
      return { ...base, mode: 'rpe', rpe: String(i.value) };
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
    case 'rpe': {
      const value = parseNumber(draft.rpe);
      if (value === undefined) errors.rpe = t('form.required');
      else if (!(value >= 1 && value <= 10))
        errors.rpe = t('form.range', { min: 1, max: 10 });
      else intensity = { kind: 'rpe', value };
      break;
    }
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
    indoor: draft.indoor,
    key: draft.key,
    intensity,
    ...(distanceKm === undefined ? {} : { distanceKm }),
    ...(title ? { title } : {}),
  };
  // Same rules as storage, without the date and source.
  const parsed = sessionSchema
    .omit({ date: true, source: true, templateId: true })
    .safeParse(session);
  if (!parsed.success)
    return { ok: false, errors: { durationMin: t('form.check') } };
  return { ok: true, session: parsed.data };
}
