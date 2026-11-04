import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  searchOpenFoodFacts,
  type OffProduct,
} from '../../data/openFoodFacts.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button, TextField } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import type { FoodEditorState } from './FoodEditorScreen.tsx';
import { draftFromOff } from './foodDraft.ts';

const show = (n: number | undefined) =>
  n === undefined ? '?' : formatNumber(n);

/** /foods/off: searches only on submit (D35). */
export function OffSearchScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'error' }
    | { kind: 'done'; products: OffProduct[] }
  >({ kind: 'idle' });

  return (
    <Screen title={t('off.title')}>
      <BackLink to="/foods" />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim().length < 2) return;
          setState({ kind: 'loading' });
          searchOpenFoodFacts(query.trim()).then(
            (products) => {
              setState({ kind: 'done', products });
            },
            () => {
              setState({ kind: 'error' });
            },
          );
        }}
      >
        <TextField
          label={t('off.query')}
          value={query}
          onChange={setQuery}
          hint={t('off.hint')}
        />
        <div className="mt-3">
          <Button type="submit">{t('off.search')}</Button>
        </div>
      </form>
      {state.kind === 'loading' && (
        <p className="mt-4 text-sm">{t('off.searching')}</p>
      )}
      {state.kind === 'error' && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {t('off.error')}
        </p>
      )}
      {state.kind === 'done' && (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {state.products.length === 0 && (
            <li className="py-2 text-sm text-slate-500">
              {t('foods.noResults')}
            </li>
          )}
          {state.products.map((p) => (
            <li key={p.code}>
              <button
                type="button"
                className="block min-h-12 w-full py-2 text-left"
                onClick={() => {
                  const next: FoodEditorState = {
                    draft: draftFromOff(p),
                    checkPortions: true,
                  };
                  void navigate('/foods/new', { state: next });
                }}
              >
                <span className="font-medium">{p.name}</span>
                {p.brand && (
                  <span className="text-sm text-slate-500"> · {p.brand}</span>
                )}
                <span className="block text-sm text-slate-500">
                  {t('foods.per100g', {
                    kcal: show(p.per100g.kcal),
                    carb: show(p.per100g.carbG),
                    protein: show(p.per100g.proteinG),
                    fat: show(p.per100g.fatG),
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
