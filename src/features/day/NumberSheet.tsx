import { PROTEIN_G_PER_KG_RANGE } from '../../engine/constants.ts';
import type { DayPlan } from '../../engine/plan.ts';
import { db, saveProfile } from '../../db/index.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { Sheet } from '../../ui/Sheet.tsx';
import { Why } from './Why.tsx';

export type DayNumber = 'kcal' | 'carb' | 'protein' | 'fat';

// Trace rule IDs behind each day number (DOMAIN E, M and T5).
const RULES: Readonly<Record<DayNumber, readonly string[]>> = {
  kcal: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'],
  carb: ['M2', 'T5', 'M3'],
  protein: ['M1'],
  fat: ['M3'],
};

const TITLE = {
  kcal: 'day.kcal',
  carb: 'day.carb',
  protein: 'day.protein',
  fat: 'day.fat',
} as const;

const g = (v: number) => formatNumber(v, 0);

/** Detail of one day target: range, the profile point inside it, trace. */
export function NumberSheet({
  which,
  plan,
  profile,
  onClose,
}: {
  which: DayNumber;
  plan: DayPlan;
  profile: StoredProfile;
  onClose: () => void;
}) {
  const save = (patch: Partial<StoredProfile>) => {
    void saveProfile(db, { ...profile, ...patch });
  };
  const rest = plan.load === 'rest' && !plan.carbLoading;
  const steps = plan.trace.filter((s) => RULES[which].includes(s.ruleId));
  const e = plan.energy;
  return (
    <Sheet title={t(TITLE[which])} onClose={onClose}>
      {which === 'kcal' && (
        <p className="mt-3 text-lg">
          {t('detail.kcalParts', {
            bmr: g(e.bmr),
            base: g(e.nonExercise - e.bmr),
            exercise: g(e.exerciseTotal),
            goal: g(e.goalAdjustment),
          })}
        </p>
      )}
      {which === 'fat' && (
        <p className="mt-3 text-lg">{t('detail.fatRemainder')}</p>
      )}

      {which === 'carb' && (
        <>
          <p className="mt-3 text-2xl font-semibold">
            {t('detail.target', { value: g(plan.macros.carbG) })}
          </p>
          <p className="text-lg">
            {t('detail.range', {
              low: g(plan.ranges.carbG[0]),
              high: g(plan.ranges.carbG[1]),
            })}
          </p>
          {rest ? (
            <p className="mt-3">{t('detail.restDay')}</p>
          ) : (
            <label className="mt-4 block">
              <span className="block text-base font-medium">
                {t('detail.carbPoint')}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={profile.carbPointInRange}
                onChange={(ev) => {
                  save({ carbPointInRange: Number(ev.target.value) });
                }}
                className="mt-2 h-12 w-full"
              />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {t('detail.everyDay')}
              </span>
            </label>
          )}
        </>
      )}

      {which === 'protein' && (
        <>
          <p className="mt-3 text-2xl font-semibold">
            {t('detail.target', { value: g(plan.macros.proteinG) })}
          </p>
          <p className="text-lg">
            {t('detail.range', {
              low: g(plan.ranges.proteinG[0]),
              high: g(plan.ranges.proteinG[1]),
            })}
          </p>
          <label className="mt-4 block">
            <span className="block text-base font-medium">
              {t('detail.proteinPerKg')}:{' '}
              {formatNumber(profile.proteinGPerKg, 1)}
            </span>
            <input
              type="range"
              min={PROTEIN_G_PER_KG_RANGE[0]}
              max={PROTEIN_G_PER_KG_RANGE[1]}
              step={0.1}
              value={profile.proteinGPerKg}
              onChange={(ev) => {
                save({ proteinGPerKg: Number(ev.target.value) });
              }}
              className="mt-2 h-12 w-full"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t('detail.everyDay')}
            </span>
          </label>
        </>
      )}

      <div className="mt-4">
        <Why steps={steps} />
      </div>
    </Sheet>
  );
}
