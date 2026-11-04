// Usage: node scripts/ciqual-convert.ts [data-src/ciqual-2025]
// Reads the official CIQUAL 2025 XML files and writes src/data/ciqual.json.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { convertCiqual } from '../src/data/ciqualConvert.ts';

const dir = process.argv[2] ?? 'data-src/ciqual-2025';
const read = (name: string) => readFile(join(dir, name), 'utf8');

const foods = convertCiqual({
  alim: await read('alim_2025_11_03.xml'),
  compo: await read('compo_2025_11_03.xml'),
});
const out = {
  source:
    'Anses. Table de composition nutritionnelle des aliments Ciqual 2025. doi:10.57745/RDMHWY',
  licence: 'Licence Ouverte / Open Licence Etalab 2.0',
  foods,
};
await writeFile('src/data/ciqual.json', JSON.stringify(out));
console.log(`wrote src/data/ciqual.json: ${String(foods.length)} foods`);
