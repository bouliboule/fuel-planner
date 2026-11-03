import { describe, expect, it } from 'vitest';
import { proteinOnGoalChange } from '../../src/engine/goalDefaults.ts';

describe('protein default on goal change (D14, D27)', () => {
  it('moves 1.8 to 2.0 when the goal becomes lose', () => {
    expect(proteinOnGoalChange(1.8, 'maintain', 'lose')).toBe(2.0);
    expect(proteinOnGoalChange(1.8, undefined, 'lose')).toBe(2.0);
  });

  it('moves 2.0 back to 1.8 when leaving lose', () => {
    expect(proteinOnGoalChange(2.0, 'lose', 'gain')).toBe(1.8);
  });

  it('keeps any value the user set', () => {
    expect(proteinOnGoalChange(1.9, 'maintain', 'lose')).toBe(1.9);
    expect(proteinOnGoalChange(2.2, 'lose', 'maintain')).toBe(2.2);
  });

  it('keeps the value when the kind does not change', () => {
    expect(proteinOnGoalChange(1.8, 'lose', 'lose')).toBe(1.8);
  });
});
