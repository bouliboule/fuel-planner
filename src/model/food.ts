import { z } from 'zod';
import { clockTime, isoDate, stored } from './common.ts';

const nonNegative = z.number().min(0);

export const foodSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  per100g: z.object({
    kcal: nonNegative,
    carbG: nonNegative,
    sugarG: nonNegative.optional(),
    fibreG: nonNegative.optional(),
    proteinG: nonNegative,
    fatG: nonNegative,
    sodiumMg: nonNegative.optional(),
    glucoseG: nonNegative.optional(),
    fructoseG: nonNegative.optional(),
  }),
  unit: z
    .object({ name: z.string().min(1), grams: z.number().positive() })
    .optional(),
  portion: z.object({
    minG: nonNegative,
    maxG: z.number().positive(),
    stepG: z.number().positive(),
    defaultG: z.number().positive(),
  }),
  tags: z.array(z.string()),
  source: z.enum(['manual', 'ciqual', 'off']),
  sourceRef: z.string().optional(),
  // CIQUAL fields reported as traces or '< x', stored as 0 (D31).
  belowDetection: z.array(z.string()).optional(),
  shopSection: z.string().min(1).optional(),
  purchaseUnit: z
    .object({ name: z.string().min(1), grams: z.number().positive() })
    .optional(),
});
export type Food = z.infer<typeof foodSchema>;
export const storedFoodSchema = stored(foodSchema);
export type StoredFood = z.infer<typeof storedFoodSchema>;

export const slotKindSchema = z.enum([
  'meal',
  'pre',
  'pre-snack',
  'during',
  'recovery',
  'snack',
  'bedtime',
]);

export const mealTemplateSchema = z.object({
  name: z.string().min(1),
  slotKinds: z.array(slotKindSchema),
  items: z.array(
    z.object({
      foodId: z.string().min(1),
      fixedG: z.number().positive().optional(),
      scalable: z.boolean(),
    }),
  ),
});
export type MealTemplate = z.infer<typeof mealTemplateSchema>;
export const storedMealTemplateSchema = stored(mealTemplateSchema);
export type StoredMealTemplate = z.infer<typeof storedMealTemplateSchema>;

export const logEntrySchema = z.object({
  date: isoDate,
  time: clockTime,
  slotKind: slotKindSchema.optional(),
  // The plan slot the entry belongs to, e.g. 'meal-1' (D38).
  slotId: z.string().min(1).optional(),
  foodId: z.string().min(1),
  grams: z.number().positive(),
});
export type LogEntry = z.infer<typeof logEntrySchema>;
export const storedLogEntrySchema = stored(logEntrySchema);
export type StoredLogEntry = z.infer<typeof storedLogEntrySchema>;
