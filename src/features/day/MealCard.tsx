import {
  Droplets,
  Lightbulb,
  Sparkles,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import { createElement, type ReactNode } from 'react';
import type { DayPlan } from '../../engine/plan.ts';
import type { Warning } from '../../engine/trace.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import { mealIcon, mealTone } from '../../ui/icons.ts';
import { exampleKey, mealTag, mealTitle, showLowFibre } from './dayText.ts';
import { WarningText } from './WarningText.tsx';

type PlanSlot = DayPlan['slots'][number];

const g = (v: number) => formatNumber(v, 0);

/** A text line led by a small icon. */
function Line({
  icon,
  className = '',
  children,
}: {
  icon: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <p className={`flex gap-2 ${className}`}>
      {createElement(icon, {
        'aria-hidden': true,
        className: 'mt-[0.2em] size-[1.1em] shrink-0 opacity-70',
      })}
      <span>{children}</span>
    </p>
  );
}

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
  const tone = mealTone(slot.guidance);
  return (
    <li
      className={`rounded-2xl border border-l-8 border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${tone.card}`}
      data-testid="meal-card"
      data-guidance={slot.guidance}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-3 text-xl font-semibold">
          <span
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${tone.tile}`}
          >
            {createElement(mealIcon(slot.guidance, slot.name), {
              'aria-hidden': true,
              className: 'size-7',
              strokeWidth: 2.25,
            })}
          </span>
          <span>
            <span className="block text-base font-medium tabular-nums text-slate-500 dark:text-slate-400">
              {slot.time}
            </span>
            {name}
          </span>
        </h3>
        {tag && (
          <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold whitespace-nowrap text-amber-900 uppercase dark:bg-amber-900/40 dark:text-amber-200">
            {t(tag)}
          </span>
        )}
      </div>

      {during ? (
        <div className="mt-3 space-y-1 text-lg">
          {slot.carbGPerH !== undefined && slot.carbGPerH > 0 && (
            <p className="text-2xl font-bold">
              {t('during.rate', {
                rate: g(slot.carbGPerH),
                total: g(slot.target.carbG),
              })}
            </p>
          )}
          {feed && feed.carbG > 0 && (
            <Line icon={Timer}>
              {t('during.feeds', { carb: g(feed.carbG) })}
            </Line>
          )}
          {slot.fluidMl !== undefined && hours && (
            <Line icon={Droplets}>
              {t('during.fluid', {
                perHour: g(slot.fluidMl / hours),
                ml: g(slot.fluidMl),
              })}
            </Line>
          )}
          {slot.sodiumMg !== undefined && hours && (
            <Line icon={Sparkles}>
              {t('during.sodium', {
                perHour: g(slot.sodiumMg / hours),
                mg: g(slot.sodiumMg),
              })}
            </Line>
          )}
          {slot.needsMultipleTransportableCarbs && (
            <p className="font-semibold">{t('during.glucoseFructose')}</p>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-3xl font-bold tabular-nums">
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

      <Line icon={Target} className="mt-3 text-lg font-medium">
        {t(`guidance.aim.${slot.guidance}`)}
      </Line>
      <Line
        icon={Lightbulb}
        className="mt-1 text-base text-slate-600 dark:text-slate-300"
      >
        {t('guidance.exampleLabel', { example: t(exampleKey(slot)) })}
      </Line>
      {showLowFibre(slot) && (
        <p className="mt-1 text-base">{t('guidance.lowFibre')}</p>
      )}
      {warnings.map((w, i) => (
        <WarningText key={`${w.code}-${String(i)}`} warning={w} />
      ))}
    </li>
  );
}
