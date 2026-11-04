import { describe, expect, it } from 'vitest';
import type { DayPlan } from '../../src/engine/plan.ts';
import { shoppingList } from '../../src/features/week/shopping.ts';
import type { StoredFood } from '../../src/model/index.ts';

const meta = { createdAt: '', updatedAt: '' };
const food = (id: string, extra: Partial<StoredFood> = {}): StoredFood => ({
  ...meta,
  id,
  name: id,
  per100g: { kcal: 100, carbG: 10, proteinG: 10, fatG: 1 },
  portion: { minG: 0, maxG: 300, stepG: 5, defaultG: 100 },
  tags: [],
  source: 'manual',
  ...extra,
});
const day = (picks: { foodId: string; grams: number }[]) =>
  ({ slots: [{ picks }] }) as unknown as DayPlan;

describe('shopping list (D36)', () => {
  it('sums grams, groups by section and rounds up purchase units', () => {
    const foods = [
      food('yogurt', {
        shopSection: 'dairy',
        purchaseUnit: { name: 'pot', grams: 500 },
      }),
      food('oats', { shopSection: 'cereals' }),
      food('salt'),
    ];
    // yogurt 300 + 250 = 550 g -> 550 / 500 = 1.1 -> 2 pots
    const list = shoppingList(
      [
        day([
          { foodId: 'yogurt', grams: 300 },
          { foodId: 'oats', grams: 50 },
        ]),
        day([
          { foodId: 'yogurt', grams: 250 },
          { foodId: 'salt', grams: 2 },
        ]),
      ],
      foods,
    );
    expect(list.map((s) => s.name)).toEqual(['cereals', 'dairy', undefined]);
    expect(list[1]?.lines[0]).toMatchObject({ grams: 550, units: 2 });
    expect(list[0]?.lines[0]).toMatchObject({ grams: 50 });
    expect(list[0]?.lines[0]?.units).toBeUndefined();
  });
});
