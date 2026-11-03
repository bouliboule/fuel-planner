import seed from '../../../seed/week-template.json';
import { t } from '../../i18n/index.ts';
import {
  sportSchema,
  zoneSchema,
  type WeekTemplate,
} from '../../model/index.ts';
import {
  draftFromSession,
  emptySessionDraft,
  sessionFromDraft,
  type SessionDraft,
  type SessionErrors,
} from '../sessions/sessionDraft.ts';

export interface TemplateSessionDraft extends SessionDraft {
  /** Stable key for the list while editing. */
  uid: string;
  weekday: number;
}

export interface TemplateDraft {
  name: string;
  sessions: TemplateSessionDraft[];
}

let nextUid = 0;
export function newUid(): string {
  nextUid += 1;
  return `s${String(nextUid)}`;
}

export function draftFromTemplate(template: WeekTemplate): TemplateDraft {
  return {
    name: template.name,
    sessions: template.sessions.map(({ weekday, ...s }) => ({
      ...draftFromSession(s),
      uid: newUid(),
      weekday,
    })),
  };
}

export function templateFromDraft(draft: TemplateDraft):
  | { ok: true; template: WeekTemplate }
  | {
      ok: false;
      nameError?: string;
      sessionErrors: Record<string, SessionErrors>;
    } {
  const sessionErrors: Record<string, SessionErrors> = {};
  const sessions: WeekTemplate['sessions'] = [];
  for (const s of draft.sessions) {
    const result = sessionFromDraft(s);
    if (result.ok) sessions.push({ ...result.session, weekday: s.weekday });
    else sessionErrors[s.uid] = result.errors;
  }
  const name = draft.name.trim();
  const nameError = name === '' ? t('form.required') : undefined;
  if (nameError || Object.keys(sessionErrors).length > 0) {
    return { ok: false, ...(nameError ? { nameError } : {}), sessionErrors };
  }
  sessions.sort(
    (a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start),
  );
  return { ok: true, template: { name, sessions } };
}

const clock = (v: unknown) =>
  typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : '';
const numberText = (v: unknown) => (typeof v === 'number' ? String(v) : '');

/**
 * The standard week from seed/week-template.json. Values marked TODO start
 * empty and must be filled in (D29).
 */
export function draftFromSeed(): TemplateDraft {
  return {
    name: seed.name,
    sessions: seed.sessions.map((s) => {
      const sport = sportSchema.parse(s.sport);
      const base: TemplateSessionDraft = {
        ...emptySessionDraft(sport),
        uid: newUid(),
        weekday: s.weekday,
        title: s.title,
        key: s.key,
        indoor: 'indoor' in s ? s.indoor : false,
        start: clock(s.start),
        durationMin: numberText(s.durationMin),
      };
      const i = s.intensity;
      if (i.kind === 'zone' && 'zone' in i) {
        const zone = zoneSchema.safeParse(i.zone);
        return {
          ...base,
          mode: 'zone',
          zone: zone.success ? zone.data : base.zone,
        };
      }
      if (i.kind === 'pace') return { ...base, mode: 'pace', pace: '' };
      if (i.kind === 'rpe' && 'value' in i)
        return { ...base, mode: 'rpe', rpe: numberText(i.value) };
      return base;
    }),
  };
}

/** The seed's morning circuit as one session per chosen weekday. */
export function seedStrengthSessions(
  weekdays: readonly number[],
): TemplateSessionDraft[] {
  const s = seed.recurringStrength;
  return weekdays.map((weekday) => ({
    ...emptySessionDraft('strength'),
    uid: `strength-${String(weekday)}`,
    weekday,
    title: s.title,
    durationMin: numberText(s.durationMin),
    start: clock(s.start),
    indoor: true,
  }));
}
