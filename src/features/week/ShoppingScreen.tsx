import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { todayIn } from '../../app/dates.ts';
import { addDays, isoWeekday, planWeek, weekDates } from '../../engine/week.ts';
import {
  db,
  getFoodChoicesBetween,
  listFoods,
  listMealTemplates,
  listSessions,
  useLiveQuery,
} from '../../db/index.ts';
import { formatNumber, t, type MessageKey } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { CheckboxField } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { useProfile } from '../settings/useProfile.ts';
import { shoppingList } from './shopping.ts';

/** /shopping?date=YYYY-MM-DD: the week containing that date (D36). */
export function ShoppingScreen() {
  const profile = useProfile();
  if (profile.loading || !profile.value) return null;
  return <Shopping profile={profile.value} />;
}

function Shopping({ profile }: { profile: StoredProfile }) {
  const [params] = useSearchParams();
  const dates = weekDates(params.get('date') ?? todayIn(profile.timeZone));
  const [selected, setSelected] = useState<string[]>(dates);
  const first = dates[0] ?? '';
  const last = dates[6] ?? '';
  const data = useLiveQuery(async () => {
    const [sessions, goals, foods, templates, choices] = await Promise.all([
      listSessions(db, first, addDays(last, 1)),
      db.goals.toArray(),
      listFoods(db),
      listMealTemplates(db),
      getFoodChoicesBetween(db, first, last),
    ]);
    const days = planWeek({
      dates,
      profile,
      goals,
      sessions,
      foods,
      templates,
      foodChoices: choices,
    });
    return { days, foods };
  }, [profile, first, last]);

  return (
    <Screen title={t('shopping.title')}>
      <BackLink to={`/week?date=${first}`} />
      <fieldset className="mt-2">
        <legend className="text-sm font-medium">{t('shopping.days')}</legend>
        <div className="grid grid-cols-2 gap-x-4">
          {dates.map((d) => (
            <CheckboxField
              key={d}
              label={`${t(`weekday.${String(isoWeekday(d))}` as MessageKey)} ${d.slice(5)}`}
              checked={selected.includes(d)}
              onChange={(on) => {
                setSelected(
                  on ? [...selected, d] : selected.filter((x) => x !== d),
                );
              }}
            />
          ))}
        </div>
      </fieldset>
      {!data.loading && (
        <List
          sections={shoppingList(
            data.value.days.filter((d) => selected.includes(d.date)),
            data.value.foods,
          )}
        />
      )}
    </Screen>
  );
}

function List({ sections }: { sections: ReturnType<typeof shoppingList> }) {
  if (sections.length === 0)
    return <p className="mt-4 text-sm text-slate-500">{t('shopping.empty')}</p>;
  return (
    <div className="mt-4">
      {sections.map((section) => (
        <section key={section.name ?? ''} className="mt-4">
          <h2 className="text-lg font-semibold">
            {section.name ?? t('shopping.other')}
          </h2>
          <ul className="mt-1 divide-y divide-slate-200 dark:divide-slate-800">
            {section.lines.map((line) => (
              <li
                key={line.food.id}
                className="flex min-h-11 items-center justify-between gap-2"
              >
                <span>{line.food.name}</span>
                <span className="font-medium">
                  {line.units === undefined
                    ? t('shopping.line', { grams: formatNumber(line.grams, 0) })
                    : t('shopping.units', {
                        count: line.units,
                        unit: line.food.purchaseUnit?.name ?? '',
                        grams: formatNumber(line.grams, 0),
                      })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
