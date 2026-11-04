/** Today's local date (YYYY-MM-DD) in an IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** IANA zones the browser knows, for the time zone picker. */
export function timeZones(): string[] {
  return Intl.supportedValuesOf('timeZone');
}

/** Current local time (HH:mm) in an IANA time zone. */
export function nowClockIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now);
}

const MS_PER_DAY = 86_400_000;

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/** Calendar date `days` after `date` (YYYY-MM-DD), negative for before. */
export function addDays(date: string, days: number): string {
  return new Date(toUtc(date) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/**
 * The goal in force on `date`: the latest `validFrom` on or before it, or
 * the earliest goal for dates before any goal starts.
 */
export function goalOn<G extends { validFrom: string }>(
  goals: readonly G[],
  date: string,
): G | undefined {
  const sorted = [...goals].sort((a, b) =>
    a.validFrom.localeCompare(b.validFrom),
  );
  return sorted.filter((g) => g.validFrom <= date).at(-1) ?? sorted[0];
}

/** 'YYYY-MM' of a date, and the month `delta` months after it. */
export function monthOf(date: string, delta = 0): string {
  const [y, m] = date.split('-').map(Number);
  const index = (y ?? 0) * 12 + ((m ?? 1) - 1) + delta;
  return `${String(Math.floor(index / 12))}-${String((index % 12) + 1).padStart(2, '0')}`;
}

/**
 * The weeks of a 'YYYY-MM' month, Monday to Sunday, as dates. Days of the
 * neighbouring months fill the first and last weeks.
 */
export function monthWeeks(month: string): string[][] {
  const first = `${month}-01`;
  const weekday = new Date(`${first}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  let day = addDays(first, -((weekday + 6) % 7));
  const weeks: string[][] = [];
  do {
    const week = Array.from({ length: 7 }, (_, i) => addDays(day, i));
    weeks.push(week);
    day = addDays(day, 7);
  } while (day.startsWith(month));
  return weeks;
}
