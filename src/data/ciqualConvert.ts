// Converts the CIQUAL 2025 XML tables (Anses, Licence Ouverte Etalab 2.0)
// into the bundled food list. Pure functions; scripts/ciqual-convert.ts
// reads the files. Rules: docs/DECISIONS.md D31.

/** CIQUAL constituent codes used by the app. */
export const CIQUAL_CONSTITUENTS = {
  kcal: '328', // Energy, Regulation EU No 1169/2011 (kcal/100g)
  carbG: '31000', // Carbohydrate (g/100g)
  proteinG: '25000', // Protein, N x Jones' factor (g/100g)
  fatG: '40000', // Fat (g/100g)
  fibreG: '34100', // Fibres (g/100g)
  sugarG: '32000', // Sugars (g/100g)
  sodiumMg: '10110', // Sodium (mg/100g)
  glucoseG: '32250', // Glucose (g/100g)
  fructoseG: '32210', // Fructose (g/100g)
} as const;

export type CiqualField = keyof typeof CIQUAL_CONSTITUENTS;
const REQUIRED: readonly CiqualField[] = ['kcal', 'carbG', 'proteinG', 'fatG'];

/** Food groups left out: 01 starters and dishes, 11 baby food. */
export const EXCLUDED_GROUPS: readonly string[] = ['01', '11'];

export interface CiqualFood {
  code: string;
  name: string;
  nameFr: string;
  group: string;
  per100g: Partial<Record<CiqualField, number>> &
    Record<'kcal' | 'carbG' | 'proteinG' | 'fatG', number>;
  belowDetection?: CiqualField[];
}

const ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&apos;': "'",
  '&quot;': '"',
};
const decode = (s: string) =>
  s.replace(/&(lt|gt|amp|apos|quot);/g, (e) => ENTITIES[e] ?? e);

/** Records of `<TAG>...</TAG>` as field maps; empty `missing` fields are omitted. */
export function* records(
  xml: string,
  tag: string,
): Generator<Record<string, string>> {
  const record = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g');
  const field = /<(\w+)>([^<]*)<\/\1>/g;
  for (const match of xml.matchAll(record)) {
    const out: Record<string, string> = {};
    for (const f of (match[1] ?? '').matchAll(field)) {
      out[f[1] ?? ''] = decode((f[2] ?? '').trim());
    }
    yield out;
  }
}

export type ParsedValue =
  { kind: 'value'; value: number } | { kind: 'below' } | { kind: 'missing' };

/** A `teneur` cell: "12,5", "traces", "< 0,5" or "-". */
export function parseTeneur(text: string | undefined): ParsedValue {
  const t = (text ?? '').trim();
  if (t === '' || t === '-') return { kind: 'missing' };
  if (t === 'traces' || t.startsWith('<')) return { kind: 'below' };
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) ? { kind: 'value', value: n } : { kind: 'missing' };
}

export function convertCiqual(xml: {
  alim: string;
  compo: string;
}): CiqualFood[] {
  const wanted = new Map<string, CiqualField>(
    Object.entries(CIQUAL_CONSTITUENTS).map(([k, v]) => [v, k as CiqualField]),
  );
  const values = new Map<string, Map<CiqualField, ParsedValue>>();
  for (const r of records(xml.compo, 'COMPO')) {
    const field = wanted.get(r.const_code ?? '');
    if (!field || !r.alim_code) continue;
    let byField = values.get(r.alim_code);
    if (!byField) {
      byField = new Map();
      values.set(r.alim_code, byField);
    }
    byField.set(field, parseTeneur(r.teneur));
  }

  const foods: CiqualFood[] = [];
  for (const a of records(xml.alim, 'ALIM')) {
    const code = a.alim_code ?? '';
    const group = a.alim_grp_code ?? '';
    if (!code || EXCLUDED_GROUPS.includes(group)) continue;
    const byField = values.get(code);
    if (!byField) continue;
    const per100g: Partial<Record<CiqualField, number>> = {};
    const below: CiqualField[] = [];
    let complete = true;
    for (const field of Object.keys(CIQUAL_CONSTITUENTS) as CiqualField[]) {
      const v = byField.get(field) ?? { kind: 'missing' };
      if (v.kind === 'value') per100g[field] = v.value;
      else if (v.kind === 'below') {
        per100g[field] = 0;
        below.push(field);
      } else if (REQUIRED.includes(field)) complete = false;
    }
    if (!complete) continue;
    foods.push({
      code,
      name: a.alim_nom_eng || a.alim_nom_fr || code,
      nameFr: a.alim_nom_fr ?? '',
      group,
      per100g: per100g as CiqualFood['per100g'],
      ...(below.length > 0 ? { belowDetection: below } : {}),
    });
  }
  return foods.sort((x, y) => x.name.localeCompare(y.name));
}
