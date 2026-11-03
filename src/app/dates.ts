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
