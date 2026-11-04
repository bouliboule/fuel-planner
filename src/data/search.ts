/** Lower case without accents, for matching typed queries. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** True when every word of `query` appears in one of `fields`. */
export function matches(query: string, ...fields: string[]): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize(fields.join(' '));
  return words.every((w) => haystack.includes(w));
}
