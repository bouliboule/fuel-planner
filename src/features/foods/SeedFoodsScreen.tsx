import { Link, useNavigate, useSearchParams } from 'react-router';
import { db, listFoods, useLiveQuery } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import { Button } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import type { FoodEditorState } from './FoodEditorScreen.tsx';
import { draftFromSeed, emptyFoodDraft, seedFoods } from './foodDraft.ts';

/** /foods/seed (also the last first-run step, ?firstRun=1). */
export function SeedFoodsScreen() {
  const [params] = useSearchParams();
  const firstRun = params.get('firstRun') === '1';
  const navigate = useNavigate();
  const foods = useLiveQuery(() => listFoods(db), []);
  const names = new Set(
    foods.loading ? [] : foods.value.map((f) => f.name.toLowerCase()),
  );
  const returnTo = firstRun ? '/foods/seed?firstRun=1' : '/foods/seed';

  return (
    <Screen title={t('seedFoods.title')}>
      {!firstRun && (
        <Link
          to="/foods"
          className="inline-flex min-h-11 items-center text-amber-700 dark:text-amber-400"
        >
          ‹ {t('common.back')}
        </Link>
      )}
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        {t('seedFoods.intro')}
      </p>
      <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {seedFoods().map((s) => {
          const added = names.has(s.name.toLowerCase());
          return (
            <li
              key={s.name}
              className="flex flex-wrap items-center justify-between gap-2 py-3"
            >
              <span>
                <span className="font-medium">{s.name}</span>
                {s.brand && (
                  <span className="text-sm text-slate-500"> · {s.brand}</span>
                )}
                <span className="block text-sm text-slate-500">
                  {s.tags.join(', ')}
                </span>
              </span>
              {added ? (
                <span className="text-sm text-emerald-700 dark:text-emerald-400">
                  {t('seedFoods.added')}
                </span>
              ) : (
                <span className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      void navigate(
                        `/foods/ciqual?q=${encodeURIComponent(s.name)}`,
                        {
                          state: { keep: draftFromSeed(s), returnTo },
                        },
                      );
                    }}
                  >
                    {t('seedFoods.fromCiqual')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const state: FoodEditorState = {
                        draft: { ...emptyFoodDraft(), ...draftFromSeed(s) },
                        checkPortions: true,
                        returnTo,
                      };
                      void navigate('/foods/new', { state });
                    }}
                  >
                    {t('seedFoods.enter')}
                  </Button>
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {firstRun && (
        <div className="mt-6">
          <Button
            onClick={() => {
              void navigate('/today', { replace: true });
            }}
          >
            {t('seedFoods.done')}
          </Button>
        </div>
      )}
    </Screen>
  );
}
