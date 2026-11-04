import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import {
  db,
  deleteFood,
  getFood,
  saveFood,
  useLiveQuery,
} from '../../db/index.ts';
import { t, type MessageKey } from '../../i18n/index.ts';
import type { StoredFood } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button, NumberField, TextField } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import {
  NUTRIENTS,
  REQUIRED_NUTRIENTS,
  draftFromFood,
  emptyFoodDraft,
  foodFromDraft,
  type FoodDraft,
  type FoodErrors,
} from './foodDraft.ts';

/** Router state for opening the editor prefilled (CIQUAL, OFF, seed). */
export interface FoodEditorState {
  draft: FoodDraft;
  checkPortions: boolean;
  returnTo?: string;
}

/** /foods/new and /foods/:id */
export function FoodEditorScreen() {
  const { id } = useParams();
  const existing = useLiveQuery(
    async () => (id ? ((await getFood(db, id)) ?? null) : null),
    [id],
  );
  if (existing.loading) return null;
  return (
    <Screen title={id ? t('food.edit') : t('food.new')}>
      <FoodEditor
        key={existing.value?.id ?? 'new'}
        existing={existing.value ?? undefined}
      />
    </Screen>
  );
}

function FoodEditor({ existing }: { existing: StoredFood | undefined }) {
  const navigate = useNavigate();
  const state = useLocation().state as FoodEditorState | null;
  const returnTo = state?.returnTo ?? '/foods';
  const [draft, setDraft] = useState<FoodDraft>(() =>
    existing ? draftFromFood(existing) : (state?.draft ?? emptyFoodDraft()),
  );
  const [errors, setErrors] = useState<FoodErrors>({});
  const checkPortions = !existing && (state?.checkPortions ?? true);
  const set = <K extends keyof FoodDraft>(key: K, value: FoodDraft[K]) => {
    setDraft({ ...draft, [key]: value });
  };

  return (
    <>
      <BackLink to={returnTo} />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const result = foodFromDraft(draft);
          if (!result.ok) {
            setErrors(result.errors);
            return;
          }
          void saveFood(db, result.food, existing).then(() =>
            navigate(returnTo),
          );
        }}
      >
        {draft.source !== 'manual' && draft.sourceRef && (
          <p className="mt-2 text-sm text-slate-500">
            {t(`food.source.${draft.source}` as MessageKey, {
              ref: draft.sourceRef,
            })}
          </p>
        )}
        {draft.belowDetection.length > 0 && (
          <p className="mt-1 text-sm text-slate-500">
            {t('food.belowDetection', {
              fields: draft.belowDetection
                .map((f) => t(`food.${f}` as MessageKey))
                .join(', '),
            })}
          </p>
        )}
        <TextField
          label={t('food.name')}
          value={draft.name}
          onChange={(v) => {
            set('name', v);
          }}
          error={errors.name}
        />
        <TextField
          label={`${t('food.brand')} (${t('common.optional')})`}
          value={draft.brand}
          onChange={(v) => {
            set('brand', v);
          }}
        />

        <h2 className="mt-6 text-lg font-semibold">{t('food.per100g')}</h2>
        <div className="grid grid-cols-2 gap-x-3">
          {NUTRIENTS.map((n) => (
            <NumberField
              key={n}
              label={
                REQUIRED_NUTRIENTS.includes(n)
                  ? t(`food.${n}`)
                  : `${t(`food.${n}`)} (${t('common.optional')})`
              }
              value={draft.per100g[n]}
              onChange={(v) => {
                set('per100g', { ...draft.per100g, [n]: v });
              }}
              error={errors[n]}
            />
          ))}
        </div>

        <h2 className="mt-6 text-lg font-semibold">{t('food.portion')}</h2>
        {checkPortions && (
          <p
            role="note"
            className="mt-1 text-sm text-amber-700 dark:text-amber-400"
          >
            {t('food.checkPortions')}
          </p>
        )}
        <div className="grid grid-cols-2 gap-x-3">
          <NumberField
            label={t('food.minG')}
            value={draft.minG}
            onChange={(v) => {
              set('minG', v);
            }}
          />
          <NumberField
            label={t('food.maxG')}
            value={draft.maxG}
            onChange={(v) => {
              set('maxG', v);
            }}
          />
          <NumberField
            label={t('food.stepG')}
            value={draft.stepG}
            onChange={(v) => {
              set('stepG', v);
            }}
          />
          <NumberField
            label={t('food.defaultG')}
            value={draft.defaultG}
            onChange={(v) => {
              set('defaultG', v);
            }}
          />
        </div>
        {errors.portion && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.portion}
          </p>
        )}

        <h2 className="mt-6 text-lg font-semibold">{t('food.unit')}</h2>
        <div className="grid grid-cols-2 gap-x-3">
          <TextField
            label={`${t('food.unitName')} (${t('common.optional')})`}
            value={draft.unitName}
            onChange={(v) => {
              set('unitName', v);
            }}
          />
          <NumberField
            label={t('food.unitGrams')}
            value={draft.unitGrams}
            onChange={(v) => {
              set('unitGrams', v);
            }}
            error={errors.unit}
          />
        </div>

        <TextField
          label={t('food.tags')}
          value={draft.tags}
          onChange={(v) => {
            set('tags', v);
          }}
          hint={t('food.tagsHint')}
        />

        <h2 className="mt-6 text-lg font-semibold">{t('shopping.title')}</h2>
        <TextField
          label={`${t('food.shopSection')} (${t('common.optional')})`}
          value={draft.shopSection}
          onChange={(v) => {
            set('shopSection', v);
          }}
        />
        <div className="grid grid-cols-2 gap-x-3">
          <TextField
            label={`${t('food.purchaseUnitName')} (${t('common.optional')})`}
            value={draft.purchaseUnitName}
            onChange={(v) => {
              set('purchaseUnitName', v);
            }}
          />
          <NumberField
            label={t('food.purchaseUnitGrams')}
            value={draft.purchaseUnitGrams}
            onChange={(v) => {
              set('purchaseUnitGrams', v);
            }}
            error={errors.purchaseUnit}
          />
        </div>

        {Object.keys(errors).length > 0 && (
          <p
            role="alert"
            className="mt-4 text-sm text-red-600 dark:text-red-400"
          >
            {t('form.fixErrors')}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="submit">{t('common.save')}</Button>
          {existing && (
            <Button
              variant="danger"
              onClick={() => {
                void deleteFood(db, existing.id).then(() => navigate(returnTo));
              }}
            >
              {t('food.delete')}
            </Button>
          )}
        </div>
      </form>
    </>
  );
}
