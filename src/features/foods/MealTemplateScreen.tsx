import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  db,
  deleteMealTemplate,
  getMealTemplate,
  listFoods,
  saveMealTemplate,
  useLiveQuery,
} from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import {
  slotKindSchema,
  type StoredFood,
  type StoredMealTemplate,
} from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import {
  Button,
  CheckboxField,
  NumberField,
  SelectField,
  TextField,
} from '../../ui/form.tsx';
import { parseNumber } from '../../ui/parse.ts';
import { Screen } from '../../ui/Screen.tsx';

interface ItemDraft {
  uid: number;
  foodId: string;
  scalable: boolean;
  fixedG: string;
}

/** /foods/templates/new and /foods/templates/:id */
export function MealTemplateScreen() {
  const { id } = useParams();
  const existing = useLiveQuery(
    async () => (id ? ((await getMealTemplate(db, id)) ?? null) : null),
    [id],
  );
  const foods = useLiveQuery(() => listFoods(db), []);
  if (existing.loading || foods.loading) return null;
  return (
    <Screen title={id ? t('mealTemplates.edit') : t('mealTemplates.new')}>
      <BackLink to="/foods?tab=templates" />
      <Editor
        key={existing.value?.id ?? 'new'}
        existing={existing.value ?? undefined}
        foods={foods.value}
      />
    </Screen>
  );
}

let uid = 0;

function Editor({
  existing,
  foods,
}: {
  existing: StoredMealTemplate | undefined;
  foods: StoredFood[];
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(existing?.name ?? '');
  const [kinds, setKinds] = useState<string[]>(existing?.slotKinds ?? []);
  const [items, setItems] = useState<ItemDraft[]>(
    () =>
      existing?.items.map((it) => ({
        uid: ++uid,
        foodId: it.foodId,
        scalable: it.scalable,
        fixedG: it.fixedG === undefined ? '' : String(it.fixedG),
      })) ?? [],
  );
  const [error, setError] = useState<string | undefined>();
  const setItem = (u: number, patch: Partial<ItemDraft>) => {
    setItems(items.map((it) => (it.uid === u ? { ...it, ...patch } : it)));
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || items.length === 0 || kinds.length === 0) {
          setError(
            items.length === 0
              ? t('mealTemplates.needsItems')
              : t('form.fixErrors'),
          );
          return;
        }
        const parsedItems = items.map((it) => {
          const fixedG = parseNumber(it.fixedG);
          return {
            foodId: it.foodId,
            scalable: it.scalable,
            ...(!it.scalable && fixedG !== undefined && fixedG > 0
              ? { fixedG }
              : {}),
          };
        });
        void saveMealTemplate(
          db,
          {
            name: name.trim(),
            slotKinds: slotKindSchema.array().parse(kinds),
            items: parsedItems,
          },
          existing,
        ).then(() => navigate('/foods?tab=templates'));
      }}
    >
      <TextField
        label={t('mealTemplates.name')}
        value={name}
        onChange={setName}
      />
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">
          {t('mealTemplates.slotKinds')}
        </legend>
        <div className="grid grid-cols-2 gap-x-4">
          {slotKindSchema.options.map((k) => (
            <CheckboxField
              key={k}
              label={t(`slot.${k}`)}
              checked={kinds.includes(k)}
              onChange={(on) => {
                setKinds(on ? [...kinds, k] : kinds.filter((x) => x !== k));
              }}
            />
          ))}
        </div>
      </fieldset>
      <h2 className="mt-6 text-lg font-semibold">{t('mealTemplates.items')}</h2>
      {items.map((it) => (
        <div
          key={it.uid}
          className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
        >
          <SelectField
            label={t('mealTemplates.food')}
            value={it.foodId}
            onChange={(v) => {
              setItem(it.uid, { foodId: v });
            }}
            options={foods.map((f) => ({ value: f.id, label: f.name }))}
          />
          <CheckboxField
            label={t('mealTemplates.scalable')}
            checked={it.scalable}
            onChange={(v) => {
              setItem(it.uid, { scalable: v });
            }}
          />
          {!it.scalable && (
            <NumberField
              label={t('mealTemplates.fixedG')}
              value={it.fixedG}
              onChange={(v) => {
                setItem(it.uid, { fixedG: v });
              }}
            />
          )}
          <div className="mt-2">
            <Button
              variant="secondary"
              onClick={() => {
                setItems(items.filter((x) => x.uid !== it.uid));
              }}
            >
              {t('common.remove')}
            </Button>
          </div>
        </div>
      ))}
      {foods.length > 0 && (
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() => {
              setItems([
                ...items,
                {
                  uid: ++uid,
                  foodId: foods[0]?.id ?? '',
                  scalable: true,
                  fixedG: '',
                },
              ]);
            }}
          >
            {t('mealTemplates.addItem')}
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="submit">{t('common.save')}</Button>
        {existing && (
          <Button
            variant="danger"
            onClick={() => {
              void deleteMealTemplate(db, existing.id).then(() =>
                navigate('/foods?tab=templates'),
              );
            }}
          >
            {t('mealTemplates.delete')}
          </Button>
        )}
      </div>
    </form>
  );
}
