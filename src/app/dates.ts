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
