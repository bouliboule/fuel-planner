import seed from '../../../seed/foods.json';
import type { CiqualFood } from '../../data/ciqual.ts';
import type { OffProduct } from '../../data/openFoodFacts.ts';
import {
  IMPORT_PORTION_DEFAULT_G,
  IMPORT_PORTION_MAX_G,
  IMPORT_PORTION_MIN_G,
  IMPORT_PORTION_STEP_G,
} from '../../engine/constants.ts';
import { t } from '../../i18n/index.ts';
import { foodSchema, type Food } from '../../model/index.ts';
import { parseNumber } from '../../ui/parse.ts';

export const NUTRIENTS = [
  'kcal',
  'carbG',
  'proteinG',
  'fatG',
  'fibreG',
  'sugarG',
  'sodiumMg',
  'glucoseG',
  'fructoseG',
] as const;
export type Nutrient = (typeof NUTRIENTS)[number];
export const REQUIRED_NUTRIENTS: readonly Nutrient[] = [
  'kcal',
  'carbG',
  'proteinG',
  'fatG',
];

export interface FoodDraft {
  name: string;
  brand: string;
  per100g: Record<Nutrient, string>;
  unitName: string;
  unitGrams: string;
  minG: string;
  maxG: string;
  stepG: string;
  defaultG: string;
  tags: string;
  shopSection: string;
  purchaseUnitName: string;
  purchaseUnitGrams: string;
  source: Food['source'];
  sourceRef: string;
  belowDetection: string[];
}

export type FoodField = 'name' | Nutrient | 'unit' | 'portion' | 'purchaseUnit';
export type FoodErrors = Partial<Record<FoodField, string>>;

const text = (n: number | undefined) => (n === undefined ? '' : String(n));
const emptyNutrients = (): Record<Nutrient, string> =>
  Object.fromEntries(NUTRIENTS.map((n) => [n, ''])) as Record<Nutrient, string>;

/** Portion fields for foods from a source without portion sizes (D33). */
const importPortions = {
  minG: String(IMPORT_PORTION_MIN_G),
  maxG: String(IMPORT_PORTION_MAX_G),
  stepG: String(IMPORT_PORTION_STEP_G),
  defaultG: String(IMPORT_PORTION_DEFAULT_G),
};

export function emptyFoodDraft(): FoodDraft {
  return {
    name: '',
    brand: '',
    per100g: emptyNutrients(),
    unitName: '',
    unitGrams: '',
    ...importPortions,
    tags: '',
    shopSection: '',
    purchaseUnitName: '',
    purchaseUnitGrams: '',
    source: 'manual',
    sourceRef: '',
    belowDetection: [],
  };
}

export function draftFromFood(food: Food): FoodDraft {
  return {
    name: food.name,
    brand: food.brand ?? '',
    per100g: Object.fromEntries(
      NUTRIENTS.map((n) => [n, text(food.per100g[n])]),
    ) as Record<Nutrient, string>,
    unitName: food.unit?.name ?? '',
    unitGrams: text(food.unit?.grams),
    minG: String(food.portion.minG),
    maxG: String(food.portion.maxG),
    stepG: String(food.portion.stepG),
    defaultG: String(food.portion.defaultG),
    tags: food.tags.join(', '),
    shopSection: food.shopSection ?? '',
    purchaseUnitName: food.purchaseUnit?.name ?? '',
    purchaseUnitGrams: text(food.purchaseUnit?.grams),
    source: food.source,
    sourceRef: food.sourceRef ?? '',
    belowDetection: food.belowDetection ?? [],
  };
}

export function draftFromCiqual(
  c: CiqualFood,
  base: Partial<FoodDraft> = {},
): FoodDraft {
  return {
    ...emptyFoodDraft(),
    name: c.name,
    per100g: Object.fromEntries(
      NUTRIENTS.map((n) => [n, text(c.per100g[n])]),
    ) as Record<Nutrient, string>,
    source: 'ciqual',
    sourceRef: c.code,
    belowDetection: c.belowDetection ?? [],
    ...base,
  };
}

export function draftFromOff(p: OffProduct): FoodDraft {
  return {
    ...emptyFoodDraft(),
    name: p.name,
    brand: p.brand ?? '',
    per100g: {
      ...emptyNutrients(),
      ...Object.fromEntries(
        Object.entries(p.per100g).map(([k, v]) => [k, String(v)]),
      ),
    },
    source: 'off',
    sourceRef: p.code,
  };
}

export interface SeedFood {
  name: string;
  brand?: string;
  tags: string[];
  unitName?: string;
}

/** seed/foods.json entries; their nutrition values are empty on purpose. */
export function seedFoods(): SeedFood[] {
  return seed.foods.map((f) => ({
    name: f.name,
    ...('brand' in f && typeof f.brand === 'string' ? { brand: f.brand } : {}),
    tags: f.tags,
    ...('unit' in f ? { unitName: f.unit.name } : {}),
  }));
}

export function draftFromSeed(s: SeedFood): Partial<FoodDraft> {
  return {
    name: s.name,
    brand: s.brand ?? '',
    tags: s.tags.join(', '),
    unitName: s.unitName ?? '',
  };
}

export function foodFromDraft(
  d: FoodDraft,
): { ok: true; food: Food } | { ok: false; errors: FoodErrors } {
  const errors: FoodErrors = {};
  if (d.name.trim() === '') errors.name = t('form.required');
  const per100g: Partial<Record<Nutrient, number>> = {};
  for (const n of NUTRIENTS) {
    const v = parseNumber(d.per100g[n]);
    if (v === undefined) {
      if (REQUIRED_NUTRIENTS.includes(n)) errors[n] = t('form.required');
    } else if (!(v >= 0)) errors[n] = t('form.check');
    else per100g[n] = v;
  }
  const minG = parseNumber(d.minG);
  const maxG = parseNumber(d.maxG);
  const stepG = parseNumber(d.stepG);
  const defaultG = parseNumber(d.defaultG);
  const portion =
    minG !== undefined &&
    maxG !== undefined &&
    stepG !== undefined &&
    defaultG !== undefined &&
    minG >= 0 &&
    maxG > 0 &&
    minG <= maxG &&
    stepG > 0 &&
    defaultG > 0
      ? { minG, maxG, stepG, defaultG }
      : undefined;
  if (!portion) errors.portion = t('food.portionInvalid');
  const unitGrams = parseNumber(d.unitGrams);
  if (d.unitName.trim() && !(unitGrams !== undefined && unitGrams > 0))
    errors.unit = t('form.check');
  const puGrams = parseNumber(d.purchaseUnitGrams);
  if (d.purchaseUnitName.trim() && !(puGrams !== undefined && puGrams > 0)) {
    errors.purchaseUnit = t('form.check');
  }
  if (Object.keys(errors).length > 0 || !portion) return { ok: false, errors };

  const tags = [
    ...new Set(
      d.tags
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const candidate: Food = {
    name: d.name.trim(),
    ...(d.brand.trim() ? { brand: d.brand.trim() } : {}),
    per100g: per100g as Food['per100g'],
    ...(d.unitName.trim() && unitGrams
      ? { unit: { name: d.unitName.trim(), grams: unitGrams } }
      : {}),
    portion,
    tags,
    source: d.source,
    ...(d.sourceRef ? { sourceRef: d.sourceRef } : {}),
    ...(d.belowDetection.length > 0
      ? { belowDetection: d.belowDetection }
      : {}),
    ...(d.shopSection.trim()
      ? { shopSection: d.shopSection.trim().toLowerCase() }
      : {}),
    ...(d.purchaseUnitName.trim() && puGrams
      ? { purchaseUnit: { name: d.purchaseUnitName.trim(), grams: puGrams } }
      : {}),
  };
  const parsed = foodSchema.safeParse(candidate);
  if (!parsed.success) return { ok: false, errors: { name: t('form.check') } };
  return { ok: true, food: parsed.data };
}
