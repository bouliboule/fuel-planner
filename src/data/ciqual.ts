import type { CiqualFood } from './ciqualConvert.ts';
import { matches } from './search.ts';

export type { CiqualFood };

let cache: Promise<CiqualFood[]> | undefined;

/** Loads the bundled CIQUAL 2025 subset on first use (a separate chunk). */
export function loadCiqual(): Promise<CiqualFood[]> {
  cache ??= import('./ciqual.json').then(
    (m) => m.default.foods as CiqualFood[],
  );
  return cache;
}

export async function searchCiqual(
  query: string,
  limit = 40,
): Promise<CiqualFood[]> {
  if (query.trim().length < 2) return [];
  const foods = await loadCiqual();
  return foods.filter((f) => matches(query, f.name, f.nameFr)).slice(0, limit);
}
