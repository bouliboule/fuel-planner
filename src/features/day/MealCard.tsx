import { createElement } from 'react';
import type { DayPlan } from '../../engine/plan.ts';
import type { Warning } from '../../engine/trace.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import { mealIcon } from '../../ui/icons.ts';
import { exampleKey, mealTag, mealTitle, showLowFibre } from './dayText.ts';
import { WarningText } from './WarningText.tsx';

type PlanSlot = DayPlan['slots'][number];

const g = (v: number) => formatNumber(v, 0);

/** One meal of the day: time, name, kcal, macros, guidance and example. */
export function MealCard({
  slot,
  durationMin,
  warnings,
}: {
  slot: PlanSlot;
  /** Length of the session, for the during card's per-hour values. */
  durationMin?: number | undefined;
  warnings: readonly Warning[];
}) {
  const title = mealTitle(slot);
  const tag = mealTag(slot);
  const name = title.name ?? (title.key ? t(title.key) : '');
  const during = slot.kind === 'during';
  const hours = durationMin ? durationMin / 60 : undefined;
  const feed = slot.schedule?.[0];
  return (
    <li
      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
      data-testid="meal-card"
      data-guidance={slot.guidance}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-3 text-xl font-semibold">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {createElement(mealIcon(slot.guidance, slot.name), {
              'aria-hidden': true,
              className: 'size-6',
            })}
          </span>
          <span>
            <span className="mr-2 tabular-nums text-slate-500 dark:text-slate-400">
              {slot.time}
            </span>
            {name}
          </span>
        </h3>
        {tag && (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium whitespace-nowrap text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
            {t(tag)}
          </span>
        )}
      </div>

      {during ? (
        <div className="mt-2 space-y-1 text-lg">
          {slot.carbGPerH !== undefined && slot.carbGPerH > 0 && (
            <p className="text-2xl font-semibold">
              {t('during.rate', {
                rate: g(slot.carbGPerH),
                total: g(slot.target.carbG),
              })}
            </p>
          )}
          {feed && feed.carbG > 0 && (
            <p>{t('during.feeds', { carb: g(feed.carbG) })}</p>
          )}
          {slot.fluidMl !== undefined && hours && (
            <p>
              {t('during.fluid', {
                perHour: g(slot.fluidMl / hours),
                ml: g(slot.fluidMl),
              })}
            </p>
          )}
          {slot.sodiumMg !== undefined && hours && (
            <p>
              {t('during.sodium', {
                perHour: g(slot.sodiumMg / hours),
                mg: g(slot.sodiumMg),
              })}
            </p>
          )}
          {slot.needsMultipleTransportableCarbs && (
            <p className="font-medium">{t('during.glucoseFructose')}</p>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-3xl font-semibold tabular-nums">
            {t('day.mealKcal', { kcal: g(slot.target.kcal) })}
          </p>
          <p className="text-lg tabular-nums">
            {t('day.mealMacros', {
              carb: g(slot.target.carbG),
              protein: g(slot.target.proteinG),
              fat: g(slot.target.fatG),
            })}
          </p>
        </div>
      )}

      <p className="mt-3 text-lg">{t(`guidance.aim.${slot.guidance}`)}</p>
      <p className="text-base text-slate-600 dark:text-slate-300">
        {t('guidance.exampleLabel', { example: t(exampleKey(slot)) })}
      </p>
      {showLowFibre(slot) && (
        <p className="mt-1 text-base">{t('guidance.lowFibre')}</p>
      )}
      {warnings.map((w, i) => (
        <WarningText key={`${w.code}-${String(i)}`} warning={w} />
      ))}
    </li>
  );
}
