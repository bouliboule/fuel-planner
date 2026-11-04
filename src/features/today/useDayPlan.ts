import { planDayWithFoods, type DayPlan } from '../../engine/plan.ts';
import { addDays, goalOn } from '../../engine/week.ts';
import {
  db,
  getFoodChoices,
  listFoods,
  listMealTemplates,
  listSessions,
  useLiveQuery,
} from '../../db/index.ts';
import type {
  StoredFood,
  StoredProfile,
  StoredSession,
} from '../../model/index.ts';

export interface DayData {
  plan: DayPlan;
  sessions: StoredSession[];
  foods: StoredFood[];
  choices: Record<string, string[]>;
}

/** The day's plan with foods, recomputed whenever its inputs change. */
export function useDayPlan(profile: StoredProfile, date: string) {
  return useLiveQuery(async (): Promise<DayData> => {
    const tomorrow = addDays(date, 1);
    const [all, goals, foods, templates, choices] = await Promise.all([
      listSessions(db, date, tomorrow),
      db.goals.toArray(),
      listFoods(db),
      listMealTemplates(db),
      getFoodChoices(db, date),
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
    return { plan, sessions, foods, choices };
  }, [profile, date]);
}
