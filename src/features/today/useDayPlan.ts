import { planDayWithFoods, type DayPlan } from '../../engine/plan.ts';
import { addDays, goalOn } from '../../engine/week.ts';
import {
  db,
  getFoodChoices,
  listFoods,
  listLog,
  listMealTemplates,
  listSessions,
  useLiveQuery,
} from '../../db/index.ts';
import type {
  StoredFood,
  StoredLogEntry,
  StoredProfile,
  StoredSession,
} from '../../model/index.ts';

export interface DayData {
  plan: DayPlan;
  sessions: StoredSession[];
  foods: StoredFood[];
  choices: Record<string, string[]>;
  log: StoredLogEntry[];
}

/** The day's plan with foods, recomputed whenever its inputs change. */
export function useDayPlan(profile: StoredProfile, date: string) {
  return useLiveQuery(async (): Promise<DayData> => {
    const tomorrow = addDays(date, 1);
    const [all, goals, foods, templates, choices, log] = await Promise.all([
      listSessions(db, date, tomorrow),
      db.goals.toArray(),
      listFoods(db),
      listMealTemplates(db),
      getFoodChoices(db, date),
      listLog(db, date),
    ]);
    const sessions = all.filter((s) => s.date === date);
    const plan = planDayWithFoods({
      date,
      profile,
      goal: goalOn(goals, date) ?? { kind: 'maintain', validFrom: date },
      sessions,
      nextDaySessions: all.filter((s) => s.date === tomorrow),
      foods,
      templates,
      foodChoices: choices,
    });
    return { plan, sessions, foods, choices, log };
  }, [profile, date]);
}
