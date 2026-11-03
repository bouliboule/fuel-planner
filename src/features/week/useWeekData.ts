import { weekDates, weekSummary } from '../../engine/week.ts';
import { db, listSessions, useLiveQuery } from '../../db/index.ts';
import type { StoredProfile } from '../../model/index.ts';

/** Per-day sessions and targets for the week containing `date`. */
export function useWeekData(profile: StoredProfile, date: string) {
  const dates = weekDates(date);
  const first = dates[0] ?? date;
  const last = dates[6] ?? date;
  return useLiveQuery(async () => {
    const [sessions, goals] = await Promise.all([
      listSessions(db, first, last),
      db.goals.toArray(),
    ]);
    return weekSummary({ dates, profile, goals, sessions });
  }, [profile, first, last]);
}
