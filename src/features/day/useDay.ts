import { addDays, goalOn } from '../../app/dates.ts';
import { planDay, type DayPlan } from '../../engine/plan.ts';
import { db, listSessions, useLiveQuery } from '../../db/index.ts';
import type { StoredProfile, StoredSession } from '../../model/index.ts';

export interface DayData {
  plan: DayPlan;
  sessions: StoredSession[];
}

/**
 * The plan for `date`, recomputed whenever the profile, goals or sessions
 * change. The next date's sessions feed the T4 fast-recovery lookahead.
 */
export function useDay(profile: StoredProfile, date: string) {
  return useLiveQuery(async (): Promise<DayData> => {
    const next = addDays(date, 1);
    const [all, goals] = await Promise.all([
      listSessions(db, date, next),
      db.goals.toArray(),
    ]);
    const sessions = all.filter((s) => s.date === date);
    const plan = planDay({
      date,
      profile,
      goal: goalOn(goals, date) ?? { kind: 'maintain', validFrom: date },
      sessions,
      nextDaySessions: all.filter((s) => s.date === next),
    });
    return { plan, sessions };
  }, [profile, date]);
}
