// M1 protein default when the goal changes (DECISIONS D14, D27): 1.8 g/kg,
// or 2.0 g/kg for a lose goal. A value the user set to anything else stays.

import type { Goal } from '../model/index.ts';
import {
  PROTEIN_G_PER_KG_DEFAULT,
  PROTEIN_G_PER_KG_DEFAULT_LOSE,
} from './constants.ts';

export function proteinOnGoalChange(
  current: number,
  from: Goal['kind'] | undefined,
  to: Goal['kind'],
): number {
  if (
    to === 'lose' &&
    from !== 'lose' &&
    current === PROTEIN_G_PER_KG_DEFAULT
  ) {
    return PROTEIN_G_PER_KG_DEFAULT_LOSE;
  }
  if (
    from === 'lose' &&
    to !== 'lose' &&
    current === PROTEIN_G_PER_KG_DEFAULT_LOSE
  ) {
    return PROTEIN_G_PER_KG_DEFAULT;
  }
  return current;
}
