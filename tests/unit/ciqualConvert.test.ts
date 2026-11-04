import { describe, expect, it } from 'vitest';
import { convertCiqual, parseTeneur } from '../../src/data/ciqualConvert.ts';

const alim = `\uFEFF<?xml version="1.0" encoding="utf-8" ?>
<TABLE>
   <ALIM>
      <alim_code> 20001 </alim_code>
      <alim_nom_fr> Banane, pulpe, crue </alim_nom_fr>
      <alim_nom_eng> Banana, pulp, raw </alim_nom_eng>
      <alim_grp_code> 02 </alim_grp_code>
   </ALIM>
   <ALIM>
      <alim_code> 25001 </alim_code>
      <alim_nom_fr> Lasagnes </alim_nom_fr>
      <alim_nom_eng> Lasagna </alim_nom_eng>
      <alim_grp_code> 01 </alim_grp_code>
   </ALIM>
   <ALIM>
      <alim_code> 30001 </alim_code>
      <alim_nom_fr> Sans lipides connus </alim_nom_fr>
      <alim_nom_eng missing=" " />
      <alim_grp_code> 07 </alim_grp_code>
   </ALIM>
</TABLE>`;

const row = (food: string, constituent: string, teneur: string) => `
   <COMPO>
      <alim_code> ${food} </alim_code>
      <const_code> ${constituent} </const_code>
      <teneur> ${teneur} </teneur>
   </COMPO>`;

const compo = `<TABLE>${[
  row('20001', '328', '94,2'),
  row('20001', '31000', '19,7'),
  row('20001', '25000', '1,06'),
  row('20001', '40000', '&lt; 0,5'),
  row('20001', '34100', 'traces'),
  row('20001', '10110', '-'),
  row('20001', '32250', '5,7'),
  row('25001', '328', '150'),
  row('25001', '31000', '15'),
  row('25001', '25000', '7'),
  row('25001', '40000', '6'),
  row('30001', '328', '400'),
  row('30001', '31000', '99'),
  row('30001', '25000', '0'),
  row('30001', '40000', '-'),
].join('')}</TABLE>`;

describe('CIQUAL conversion (D31)', () => {
  it('parses cells', () => {
    expect(parseTeneur(' 12,5 ')).toEqual({ kind: 'value', value: 12.5 });
    expect(parseTeneur('traces')).toEqual({ kind: 'below' });
    expect(parseTeneur('< 0,5')).toEqual({ kind: 'below' });
    expect(parseTeneur('-')).toEqual({ kind: 'missing' });
  });

  it('keeps complete foods outside excluded groups', () => {
    const foods = convertCiqual({ alim, compo });
    // Lasagna is a mixed dish (group 01); the third food has no fat value.
    expect(foods).toEqual([
      {
        code: '20001',
        name: 'Banana, pulp, raw',
        nameFr: 'Banane, pulpe, crue',
        group: '02',
        per100g: {
          kcal: 94.2,
          carbG: 19.7,
          proteinG: 1.06,
          fatG: 0,
          fibreG: 0,
          glucoseG: 5.7,
        },
        belowDetection: ['fatG', 'fibreG'],
      },
    ]);
  });
});
