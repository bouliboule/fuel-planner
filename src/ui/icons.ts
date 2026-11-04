// Icon choices for sports, meals and day targets (lucide-react, D51). Icons
// are decorative: callers keep a text label and render them aria-hidden.

import {
  Activity,
  Banana,
  BatteryFull,
  Bike,
  Droplet,
  Drumstick,
  Dumbbell,
  Flame,
  Footprints,
  GlassWater,
  HeartPulse,
  Moon,
  PersonStanding,
  Apple,
  Sun,
  Sunrise,
  Sunset,
  Utensils,
  Wheat,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { GuidanceKey } from '../engine/guidance.ts';
import type { Sport } from '../model/index.ts';

export const SPORT_ICON: Readonly<Record<Sport, LucideIcon>> = {
  ride: Bike,
  run: HeartPulse,
  strength: Dumbbell,
  pilates: PersonStanding,
  walk: Footprints,
  other: Activity,
};

const GUIDANCE_ICON: Readonly<Record<GuidanceKey, LucideIcon>> = {
  'pre-meal': Zap,
  pre: Zap,
  'pre-snack': Banana,
  during: GlassWater,
  'during-rinse': GlassWater,
  'recovery-meal': BatteryFull,
  recovery: BatteryFull,
  'recovery-fast': BatteryFull,
  meal: Utensils,
  snack: Apple,
  bedtime: Moon,
};

const MEAL_NAME_ICON: Readonly<Record<string, LucideIcon>> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Sunset,
};

/** Icon for a meal card: its role first, then the usual meal name. */
export function mealIcon(guidance: GuidanceKey, name?: string): LucideIcon {
  if (guidance === 'meal') {
    return MEAL_NAME_ICON[(name ?? '').trim().toLowerCase()] ?? Utensils;
  }
  return GUIDANCE_ICON[guidance];
}

export const TOTAL_ICON = {
  kcal: Flame,
  carb: Wheat,
  protein: Drumstick,
  fat: Droplet,
} as const;
