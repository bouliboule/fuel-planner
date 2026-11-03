/** Parses a user-typed number; accepts a comma as decimal separator. */
export function parseNumber(text: string): number | undefined {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : Number.NaN;
}
