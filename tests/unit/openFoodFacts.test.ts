import { describe, expect, it } from 'vitest';
import { mapOffProducts } from '../../src/data/openFoodFacts.ts';
import { matches } from '../../src/data/search.ts';

describe('Open Food Facts mapping', () => {
  it('maps per 100 g values and converts sodium to mg', () => {
    expect(
      mapOffProducts({
        products: [
          {
            code: '123',
            product_name: 'Test bar',
            brands: 'Brand A, Brand B',
            nutriments: {
              'energy-kcal_100g': 400,
              carbohydrates_100g: 60,
              proteins_100g: 10,
              fat_100g: 12,
              sodium_100g: 0.2,
            },
          },
          { code: '', product_name: 'No code' },
        ],
      }),
    ).toEqual([
      {
        code: '123',
        name: 'Test bar',
        brand: 'Brand A',
        per100g: {
          kcal: 400,
          carbG: 60,
          proteinG: 10,
          fatG: 12,
          sodiumMg: 200,
        },
      },
    ]);
  });
});

describe('search matching', () => {
  it('ignores case and accents and needs every word', () => {
    expect(matches('banane crue', 'Banana, raw', 'Banane, pulpe, crue')).toBe(
      true,
    );
    expect(matches('Yaourt grec', 'Greek yoghurt', 'Yaourt à la grecque')).toBe(
      true,
    );
    expect(matches('banane cuite', 'Banana, raw', 'Banane, crue')).toBe(false);
  });
});
