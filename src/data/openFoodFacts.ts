// Open Food Facts search (ODbL), on user action only. Browsers cannot set the
// User-Agent header the API asks for, so requests carry the browser's own
// (D35). Search is limited to 10 requests per minute per user.

export interface OffProduct {
  code: string;
  name: string;
  brand?: string;
  per100g: {
    kcal?: number;
    carbG?: number;
    proteinG?: number;
    fatG?: number;
    fibreG?: number;
    sugarG?: number;
    sodiumMg?: number;
  };
}

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const FIELDS = 'code,product_name,brands,nutriments';

interface OffResponse {
  products?: {
    code?: string;
    product_name?: string;
    brands?: string;
    nutriments?: Record<string, unknown>;
  }[];
}

const num = (v: unknown) =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

export function mapOffProducts(body: OffResponse): OffProduct[] {
  return (body.products ?? []).flatMap((p) => {
    if (!p.code || !p.product_name) return [];
    const n = p.nutriments ?? {};
    const sodiumG = num(n.sodium_100g);
    const per100g = Object.fromEntries(
      Object.entries({
        kcal: num(n['energy-kcal_100g']),
        carbG: num(n.carbohydrates_100g),
        proteinG: num(n.proteins_100g),
        fatG: num(n.fat_100g),
        fibreG: num(n.fiber_100g),
        sugarG: num(n.sugars_100g),
        // OFF reports sodium in g/100 g.
        sodiumMg: sodiumG === undefined ? undefined : sodiumG * 1000,
      }).filter(([, v]) => v !== undefined),
    ) as OffProduct['per100g'];
    const brand = p.brands?.split(',')[0]?.trim();
    return [
      {
        code: p.code,
        name: p.product_name,
        ...(brand ? { brand } : {}),
        per100g,
      },
    ];
  });
}

export async function searchOpenFoodFacts(
  query: string,
): Promise<OffProduct[]> {
  const params = new URLSearchParams({
    search_terms: query,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '20',
    fields: FIELDS,
  });
  const response = await fetch(`${SEARCH_URL}?${params.toString()}`);
  if (!response.ok)
    throw new Error(`Open Food Facts ${String(response.status)}`);
  return mapOffProducts((await response.json()) as OffResponse);
}
