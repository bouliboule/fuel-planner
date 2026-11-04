import seed from '../../../seed/profile.json';
import { t } from '../../i18n/index.ts';
import {
  goalSchema,
  profileDefaults,
  profileSchema,
  type Goal,
  type Profile,
} from '../../model/index.ts';
import { parseNumber } from '../../ui/parse.ts';

/** Profile fields as typed in the form; numbers stay strings until saved. */
export interface ProfileDraft {
  sex: string;
  birthYear: string;
  heightCm: string;
  massKg: string;
  bodyFatPct: string;
  ftpW: string;
  timeZone: string;
  wakeTime: string;
  sleepTime: string;
  usualMeals: DraftMeal[];
}

/** A usual meal as typed; the kcal range stays as two strings (D55). */
export interface DraftMeal {
  name: string;
  time: string;
  kcalMin: string;
  kcalMax: string;
}

export type DraftErrors<K extends string> = Partial<Record<K, string>>;

const text = (n: number | undefined) => (n === undefined ? '' : String(n));
const isClock = (v: unknown): v is string =>
  typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const num = (v: unknown) => (typeof v === 'number' ? String(v) : '');

export function draftFromProfile(p: Profile): ProfileDraft {
  return {
    sex: p.sex,
    birthYear: text(p.birthYear),
    heightCm: text(p.heightCm),
    massKg: text(p.massKg),
    bodyFatPct: text(p.bodyFatPct),
    ftpW: text(p.ftpW),
    timeZone: p.timeZone,
    wakeTime: p.wakeTime,
    sleepTime: p.sleepTime,
    usualMeals: p.usualMeals.map((m) => ({
      name: m.name,
      time: m.time,
      kcalMin: text(m.kcalRange?.[0]),
      kcalMax: text(m.kcalRange?.[1]),
    })),
  };
}

/** First-run draft from seed/profile.json; TODO values start empty. */
export function draftFromSeed(): ProfileDraft {
  return {
    sex: seed.sex === 'male' || seed.sex === 'female' ? seed.sex : '',
    birthYear: num(seed.birthYear),
    heightCm: num(seed.heightCm),
    massKg: num(seed.massKg),
    bodyFatPct: num(seed.bodyFatPct),
    ftpW: num(seed.ftpW),
    timeZone:
      typeof seed.timeZone === 'string'
        ? seed.timeZone
        : profileDefaults.timeZone,
    wakeTime: isClock(seed.wakeTime) ? seed.wakeTime : '',
    sleepTime: isClock(seed.sleepTime) ? seed.sleepTime : '',
    usualMeals: seed.usualMeals.map((m) => ({
      name: m.name,
      time: isClock(m.time) ? m.time : '',
      kcalMin: num(m.kcalRange[0]),
      kcalMax: num(m.kcalRange[1]),
    })),
  };
}

/** Profile values not edited in the profile form, for a new profile. */
export function seedProfileRest(): Omit<Profile, keyof ProfileDraft> {
  return {
    neaFactor:
      typeof seed.neaFactor === 'number'
        ? seed.neaFactor
        : profileDefaults.neaFactor,
    grossEfficiency:
      typeof seed.grossEfficiency === 'number'
        ? seed.grossEfficiency
        : profileDefaults.grossEfficiency,
    proteinGPerKg:
      typeof seed.proteinGPerKg === 'number'
        ? seed.proteinGPerKg
        : profileDefaults.proteinGPerKg,
    carbPointInRange:
      typeof seed.carbPointInRange === 'number'
        ? seed.carbPointInRange
        : profileDefaults.carbPointInRange,
  };
}

type ProfileField = keyof ProfileDraft;

export function profileFromDraft(
  draft: ProfileDraft,
  rest: Omit<Profile, keyof ProfileDraft> &
    Partial<Pick<Profile, 'massKg' | 'bodyFatPct' | 'ftpW'>>,
):
  | { ok: true; profile: Profile }
  | { ok: false; errors: DraftErrors<ProfileField> } {
  const errors: DraftErrors<ProfileField> = {};
  const required = (field: ProfileField, value: number | undefined) => {
    if (value === undefined) errors[field] = t('form.required');
    return value;
  };
  const bodyFatPct = parseNumber(draft.bodyFatPct);
  const ftpW = parseNumber(draft.ftpW);
  // The draft decides body fat and FTP; an emptied field removes them.
  const base = { ...rest };
  delete base.bodyFatPct;
  delete base.ftpW;
  const candidate = {
    ...base,
    sex: draft.sex,
    birthYear: required('birthYear', parseNumber(draft.birthYear)),
    heightCm: required('heightCm', parseNumber(draft.heightCm)),
    massKg: required('massKg', parseNumber(draft.massKg)),
    ...(bodyFatPct === undefined ? {} : { bodyFatPct }),
    ...(ftpW === undefined ? {} : { ftpW }),
    timeZone: draft.timeZone,
    wakeTime: draft.wakeTime,
    sleepTime: draft.sleepTime,
    usualMeals: draft.usualMeals.map((m) => {
      const lo = parseNumber(m.kcalMin);
      const hi = parseNumber(m.kcalMax);
      if ((lo === undefined) !== (hi === undefined) || (lo ?? 0) > (hi ?? 0))
        errors.usualMeals = t('profile.mealKcalCheck');
      return lo === undefined || hi === undefined
        ? { name: m.name, time: m.time }
        : { name: m.name, time: m.time, kcalRange: [lo, hi] };
    }),
  };
  if (draft.usualMeals.length === 0)
    errors.usualMeals = t('profile.mealsRequired');

  const parsed = profileSchema.safeParse(candidate);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && field in draft && !(field in errors)) {
        errors[field as ProfileField] = t('form.check');
      }
    }
  }
  if (Object.keys(errors).length > 0 || !parsed.success)
    return { ok: false, errors };
  return { ok: true, profile: parsed.data };
}

/** Goal fields as typed in the form. */
export interface GoalDraft {
  kind: Goal['kind'];
  rateKgPerWeek: string;
  gainKcalPerDay: string;
  hasEvent: boolean;
  eventName: string;
  eventDate: string;
  eventDurationMin: string;
}

export function draftFromGoal(goal: Goal | undefined): GoalDraft {
  return {
    kind: goal?.kind ?? 'maintain',
    rateKgPerWeek: text(goal?.rateKgPerWeek),
    gainKcalPerDay: text(goal?.gainKcalPerDay),
    hasEvent: goal?.event !== undefined,
    eventName: goal?.event?.name ?? '',
    eventDate: goal?.event?.date ?? '',
    eventDurationMin: text(goal?.event?.expectedDurationMin),
  };
}

export type GoalErrors = DraftErrors<GoalField>;
export type GoalField =
  | 'rateKgPerWeek'
  | 'gainKcalPerDay'
  | 'eventName'
  | 'eventDate'
  | 'eventDurationMin';

export function goalFromDraft(
  draft: GoalDraft,
  validFrom: string,
): { ok: true; goal: Goal } | { ok: false; errors: DraftErrors<GoalField> } {
  const errors: DraftErrors<GoalField> = {};
  const goal: Record<string, unknown> = { kind: draft.kind, validFrom };
  if (draft.kind === 'lose') {
    const rate = parseNumber(draft.rateKgPerWeek);
    if (rate === undefined) errors.rateKgPerWeek = t('form.required');
    goal.rateKgPerWeek = rate;
  }
  if (draft.kind === 'gain') {
    const kcal = parseNumber(draft.gainKcalPerDay);
    if (kcal !== undefined) goal.gainKcalPerDay = kcal;
  }
  if (draft.hasEvent) {
    goal.event = {
      name: draft.eventName.trim(),
      date: draft.eventDate,
      expectedDurationMin: parseNumber(draft.eventDurationMin),
    };
  }
  const parsed = goalSchema.safeParse(goal);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const [first, second] = issue.path;
      const field: GoalField | undefined =
        first === 'event'
          ? second === 'name'
            ? 'eventName'
            : second === 'date'
              ? 'eventDate'
              : 'eventDurationMin'
          : first === 'rateKgPerWeek' || first === 'gainKcalPerDay'
            ? first
            : undefined;
      if (field && !(field in errors)) errors[field] = t('form.check');
    }
  }
  if (Object.keys(errors).length > 0 || !parsed.success)
    return { ok: false, errors };
  return { ok: true, goal: parsed.data };
}
