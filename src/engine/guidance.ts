// Meal guidance (docs/DOMAIN.md section 5, rule G1): one key per slot, from
// its kind and role. The UI turns the key into the "aim for" and example
// lines through i18n; the key carries no amounts.

import type { Slot } from './slots.ts';

export type GuidanceKey =
  | 'pre-meal'
  | 'pre'
  | 'pre-snack'
  | 'during'
  | 'during-rinse'
  | 'recovery-meal'
  | 'recovery'
  | 'recovery-fast'
  | 'meal'
  | 'snack'
  | 'bedtime';

/** G1: first matching rule wins, in the order of the DOMAIN list. */
export function mealGuidance(
  slot: Pick<Slot, 'kind' | 'role' | 'mouthRinseOptional' | 'recoveryMode'>,
): GuidanceKey {
  switch (slot.kind) {
    case 'during':
      return slot.mouthRinseOptional ? 'during-rinse' : 'during';
    case 'pre-snack':
      return 'pre-snack';
    case 'pre':
      return 'pre';
    case 'recovery':
      return slot.recoveryMode === 'fast' ? 'recovery-fast' : 'recovery';
    case 'bedtime':
      return 'bedtime';
    case 'snack':
      return 'snack';
    case 'meal':
      if (slot.role === 'pre') return 'pre-meal';
      if (slot.role === 'recovery') return 'recovery-meal';
      return 'meal';
  }
}
