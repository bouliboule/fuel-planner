// Local wall-clock times as minutes since midnight. Slots after midnight keep
// minutes of 1440 or more so they sort after the rest of the day.

export const MINUTES_PER_DAY = 1440;

export function toMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toClock(minutes: number): string {
  const wrapped =
    ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(wrapped / 60);
  const m = Math.round(wrapped % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
