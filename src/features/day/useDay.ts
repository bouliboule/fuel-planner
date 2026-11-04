import { addDays, goalOn } from '../../app/dates.ts';
import { backToBackWarnings, hardKind } from '../../engine/backToBack.ts';
import { planDay, type DayPlan } from '../../engine/plan.ts';
import type { Warning } from '../../engine/trace.ts';
import { db, listSessions, useLiveQuery } from '../../db/index.ts';
import type { StoredProfile, StoredSession } from '../../model/index.ts';

export interface DayData {
  plan: DayPlan;
  sessions: StoredSession[];
  /** Sessions of the day before and after, for the D53 check. */
  dayBefore: StoredSession[];
  dayAfter: StoredSession[];
  /** D53 warnings by session id. */
  backToBack: Map<string, Warning[]>;
  /** Session ids that are hard rides or runs (D52). */
  hard: Set<string>;
}

/**
 * The plan for `date`, recomputed whenever the profile, goals or sessions
 * change. The next date's sessions feed the T4 fast-recovery lookahead;
 * both neighbouring dates feed the back-to-back check.
 */
export function useDay(profile: StoredProfile, date: string) {
  return useLiveQuery(async (): Promise<DayData> => {
    const before = addDays(date, -1);
    const after = addDays(date, 1);
    const [all, goals] = await Promise.all([
      listSessions(db, before, after),
      db.goals.toArray(),
    ]);
    const on = (d: string) => all.filter((s) => s.date === d);
    const sessions = on(date);
    const dayBefore = on(before);
    const dayAfter = on(after);
    const plan = planDay({
      date,
      profile,
      goal: goalOn(goals, date) ?? { kind: 'maintain', validFrom: date },
      sessions,
      nextDaySessions: dayAfter,
    });
    const backToBack = new Map(
      sessions.map((s) => [
        s.id,
        backToBackWarnings({ session: s, dayBefore, dayAfter, profile }),
      ]),
    );
    const hard = new Set(
      sessions.filter((s) => hardKind(s, profile)).map((s) => s.id),
    );
    return { plan, sessions, dayBefore, dayAfter, backToBack, hard };
  }, [profile, date]);
}
