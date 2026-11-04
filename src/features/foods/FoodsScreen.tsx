import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { matches } from '../../data/search.ts';
import {
  db,
  listFoods,
  listMealTemplates,
  useLiveQuery,
} from '../../db/index.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import { SelectField, TextField } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';

const linkButton =
  'inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 font-medium dark:border-slate-700';

export function FoodsScreen() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'templates' ? 'templates' : 'foods';
  return (
    <Screen title={t('foods.title')}>
      <div role="tablist" className="mt-2 flex gap-2">
        {(['foods', 'templates'] as const).map((name) => (
          <button
            key={name}
            role="tab"
            type="button"
            aria-selected={tab === name}
            className={`min-h-11 rounded-lg px-4 font-medium ${
              tab === name
                ? 'bg-amber-600 text-white'
                : 'border border-slate-300 dark:border-slate-700'
            }`}
            onClick={() => {
              setParams(name === 'foods' ? {} : { tab: name });
            }}
          >
            {name === 'foods' ? t('foods.tabFoods') : t('foods.tabTemplates')}
          </button>
        ))}
      </div>
      {tab === 'foods' ? <FoodList /> : <MealTemplateList />}
    </Screen>
  );
}

function FoodList() {
  const foods = useLiveQuery(() => listFoods(db), []);
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('');
  if (foods.loading) return null;
  const all = foods.value;
  const tags = [...new Set(all.flatMap((f) => f.tags))].sort();
  const shown = all.filter(
    (f) =>
      (!query || matches(query, f.name, f.brand ?? '')) &&
      (!tag || f.tags.includes(tag)),
  );
  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/foods/new" className={linkButton}>
          {t('foods.add')}
        </Link>
        <Link to="/foods/ciqual" className={linkButton}>
          {t('foods.addCiqual')}
        </Link>
        <Link to="/foods/off" className={linkButton}>
          {t('foods.addOff')}
        </Link>
      </div>
      {all.length === 0 ? (
        <div className="mt-6">
          <p className="text-sm text-slate-500">{t('foods.empty')}</p>
          <Link
            to="/foods/seed"
            className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-amber-600 px-4 font-medium text-white"
          >
            {t('foods.loadSeed')}
          </Link>
        </div>
      ) : (
        <>
          <TextField
            label={t('foods.search')}
            value={query}
            onChange={setQuery}
          />
          <SelectField
            label={t('foods.tagFilter')}
            value={tag}
            onChange={setTag}
            options={[
              { value: '', label: t('foods.allTags') },
              ...tags.map((x) => ({ value: x, label: x })),
            ]}
          />
          <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
            {shown.map((f) => (
              <li key={f.id}>
                <Link to={`/foods/${f.id}`} className="block min-h-12 py-2">
                  <span className="font-medium">{f.name}</span>
                  {f.brand && (
                    <span className="text-sm text-slate-500"> · {f.brand}</span>
                  )}
                  <span className="block text-sm text-slate-500">
                    {t('foods.per100g', {
                      kcal: formatNumber(f.per100g.kcal, 0),
                      carb: formatNumber(f.per100g.carbG),
                      protein: formatNumber(f.per100g.proteinG),
                      fat: formatNumber(f.per100g.fatG),
                    })}
                    {f.tags.length > 0 && ` · ${f.tags.join(', ')}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {shown.length === 0 && (
            <p className="mt-2 text-sm text-slate-500">
              {t('foods.noResults')}
            </p>
          )}
          <p className="mt-6">
            <Link
              to="/foods/seed"
              className="text-amber-700 dark:text-amber-400"
            >
              {t('foods.loadSeed')} ›
            </Link>
          </p>
        </>
      )}
    </>
  );
}

function MealTemplateList() {
  const templates = useLiveQuery(() => listMealTemplates(db), []);
  if (templates.loading) return null;
  return (
    <>
      {templates.value.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          {t('mealTemplates.empty')}
        </p>
      )}
      <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {templates.value.map((tpl) => (
          <li key={tpl.id}>
            <Link
              to={`/foods/templates/${tpl.id}`}
              className="block min-h-12 py-2"
            >
              <span className="font-medium">{tpl.name}</span>
              <span className="block text-sm text-slate-500">
                {tpl.slotKinds.map((k) => t(`slot.${k}`)).join(', ')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        <Link
          to="/foods/templates/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-amber-600 px-4 font-medium text-white"
        >
          {t('mealTemplates.new')}
        </Link>
      </p>
    </>
  );
}
