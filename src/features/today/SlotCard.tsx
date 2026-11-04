import { useState } from 'react';
import { candidateFoods } from '../../engine/portions.ts';
import type { Slot } from '../../engine/slots.ts';
import type { TraceStep, Warning } from '../../engine/trace.ts';
import { db, setFoodChoice } from '../../db/index.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { StoredFood, StoredProfile } from '../../model/index.ts';
import { Button } from '../../ui/form.tsx';
import { WarningText } from './WarningText.tsx';
import { Why } from './Why.tsx';

const g = (n: number) => formatNumber(n, 0);

function amount(food: StoredFood | undefined, grams: number): string {
  if (food?.unit) {
    const count = grams / food.unit.grams;
    if (Number.isInteger(count))
      return t('slot.units', { count, unit: food.unit.name });
  }
  return t('slot.grams', { grams: g(grams) });
}

export function SlotCard({
  slot,
  date,
  foods,
  profile,
  choice,
  warnings,
  trace,
}: {
  slot: Slot;
  date: string;
  foods: StoredFood[];
  profile: StoredProfile;
  choice: string[] | undefined;
  warnings: Warning[];
  trace: TraceStep[];
}) {
  const [swapping, setSwapping] = useState<string | undefined>();
  const byId = new Map(foods.map((f) => [f.id, f]));
  const picks = slot.picks ?? [];
  const title = slot.name ?? t(`slot.${slot.kind}`);
  const role = slot.role ? ` · ${t(`slot.role.${slot.role}`)}` : '';
  const steps = trace.filter(
    (s) =>
      (slot.sessionId !== undefined && s.inputs.sessionId === slot.sessionId) ||
      s.ruleId === 'S4',
  );
  const rangeStep: TraceStep[] = slot.targetRanges
    ? [
        {
          ruleId: 'S4',
          label: 'Slot target ranges (g)',
          inputs: {
            ...(slot.targetRanges.carbG
              ? {
                  carbFrom: slot.targetRanges.carbG[0],
                  carbTo: slot.targetRanges.carbG[1],
                }
              : {}),
            ...(slot.targetRanges.proteinG
              ? {
                  proteinFrom: slot.targetRanges.proteinG[0],
                  proteinTo: slot.targetRanges.proteinG[1],
                }
              : {}),
          },
          output: slot.target.carbG,
        },
      ]
    : [];
  const d = slot;

  return (
    <article
      aria-label={`${slot.time} ${title}`}
      className="mt-3 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">
          {slot.time} {title}
          <span className="text-sm font-normal text-slate-500">{role}</span>
        </h3>
        {slot.withinTolerance === false && (
          <span className="rounded bg-amber-100 px-2 text-xs text-amber-900 dark:bg-amber-900 dark:text-amber-50">
            {t('slot.gapBadge')}
          </span>
        )}
      </header>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        {t('slot.targets', {
          kcal: g(slot.target.kcal),
          carb: g(slot.target.carbG),
          protein: g(slot.target.proteinG),
          fat: g(slot.target.fatG),
        })}
      </p>
      {slot.fibreLimited && (
        <p className="text-sm text-slate-500">{t('slot.lowFibre')}</p>
      )}

      {slot.kind === 'during' && (
        <div className="mt-2 text-sm">
          {d.mouthRinseOptional ? (
            <p>{t('today.during.rinse')}</p>
          ) : (
            <p>
              {t('today.during.rate', {
                total: g(slot.target.carbG),
                rate: formatNumber(d.carbGPerH ?? 0, 0),
              })}
            </p>
          )}
          {d.fluidMl !== undefined && (
            <p>{t('today.during.fluid', { ml: g(d.fluidMl) })}</p>
          )}
          {d.sodiumMg !== undefined && (
            <p>{t('today.during.sodium', { mg: g(d.sodiumMg) })}</p>
          )}
          {d.needsMultipleTransportableCarbs && (
            <p>{t('today.during.glucoseFructose')}</p>
          )}
          {d.schedule && d.schedule.length > 0 && (
            <details>
              <summary className="inline-flex min-h-11 cursor-pointer items-center">
                {t('today.during.feeds')}
              </summary>
              <ul>
                {d.schedule.map((f) => (
                  <li key={f.atMin}>
                    {t('today.during.feed', {
                      min: f.atMin,
                      carb: formatNumber(f.carbG, 0),
                    })}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {picks.length > 0 && (
            <p className="mt-1 font-medium">{t('today.during.pack')}</p>
          )}
        </div>
      )}

      {slot.target.kcal > 0 && picks.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">{t('slot.noFoods')}</p>
      )}
      <ul className="mt-2">
        {picks.map((p) => {
          const food = byId.get(p.foodId);
          const alternatives = candidateFoods(
            { kind: slot.kind, name: slot.name },
            foods,
            profile,
          ).filter((f) => !picks.some((x) => x.foodId === f.id));
          return (
            <li key={p.foodId}>
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between text-left"
                aria-expanded={swapping === p.foodId}
                onClick={() => {
                  setSwapping(swapping === p.foodId ? undefined : p.foodId);
                }}
              >
                <span>{food?.name ?? p.foodId}</span>
                <span className="font-medium">{amount(food, p.grams)}</span>
              </button>
              {swapping === p.foodId && (
                <div className="mb-2 rounded-lg bg-slate-100 p-2 dark:bg-slate-900">
                  <p className="text-sm">
                    {t('slot.swapFor', { name: food?.name ?? '' })}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {alternatives.map((alt) => (
                      <Button
                        key={alt.id}
                        variant="secondary"
                        onClick={() => {
                          const ids = picks.map((x) =>
                            x.foodId === p.foodId ? alt.id : x.foodId,
                          );
                          setSwapping(undefined);
                          void setFoodChoice(db, date, slot.id, ids);
                        }}
                      >
                        {alt.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {choice && (
        <Button
          variant="secondary"
          onClick={() => {
            void setFoodChoice(db, date, slot.id, undefined);
          }}
        >
          {t('slot.reset')}
        </Button>
      )}
      {slot.withinTolerance === false && slot.achieved && picks.length > 0 && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
          {t('slot.achieved', {
            kcal: g(slot.achieved.kcal),
            carb: g(slot.achieved.carbG),
            protein: g(slot.achieved.proteinG),
            fat: g(slot.achieved.fatG),
          })}
        </p>
      )}
      {warnings.map((w, i) => (
        <WarningText key={i} warning={w} />
      ))}
      <Why steps={[...rangeStep, ...steps]} />
    </article>
  );
}
