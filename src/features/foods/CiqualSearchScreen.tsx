import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { searchCiqual, type CiqualFood } from '../../data/ciqual.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { TextField } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import type { FoodEditorState } from './FoodEditorScreen.tsx';
import { draftFromCiqual, type FoodDraft } from './foodDraft.ts';

/** /foods/ciqual?q=... Router state can carry seed fields to keep. */
export function CiqualSearchScreen() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const keep =
    (useLocation().state as {
      keep?: Partial<FoodDraft>;
      returnTo?: string;
    } | null) ?? {};
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [results, setResults] = useState<CiqualFood[]>([]);

  useEffect(() => {
    let current = true;
    void searchCiqual(query).then((r) => {
      if (current) setResults(r);
    });
    return () => {
      current = false;
    };
  }, [query]);

  return (
    <Screen title={t('ciqual.title')}>
      <BackLink to={keep.returnTo ?? '/foods'} />
      <TextField
        label={t('ciqual.query')}
        value={query}
        onChange={setQuery}
        hint={t('ciqual.hint')}
      />
      <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
        {results.map((f) => (
          <li key={f.code}>
            <button
              type="button"
              className="block min-h-12 w-full py-2 text-left"
              onClick={() => {
                const state: FoodEditorState = {
                  draft: draftFromCiqual(f, keep.keep),
                  checkPortions: true,
                  ...(keep.returnTo ? { returnTo: keep.returnTo } : {}),
                };
                void navigate('/foods/new', { state });
              }}
            >
              <span className="font-medium">{f.name}</span>
              <span className="block text-sm text-slate-500">
                {f.nameFr} ·{' '}
                {t('foods.per100g', {
                  kcal: formatNumber(f.per100g.kcal, 0),
                  carb: formatNumber(f.per100g.carbG),
                  protein: formatNumber(f.per100g.proteinG),
                  fat: formatNumber(f.per100g.fatG),
                })}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">{t('foods.noResults')}</p>
      )}
    </Screen>
  );
}
