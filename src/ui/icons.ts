// Icons and colour tones for sports, meals, day load and targets
// (lucide-react, D51; UX "Icons"). Icons are decorative: callers keep a text
// label and render them aria-hidden. Class strings stay literal so Tailwind
// finds them.

import {
  Activity,
  Apple,
  Banana,
  BatteryCharging,
  Bike,
  Droplet,
  Drumstick,
  Dumbbell,
  Feather,
  Flame,
  Footprints,
  Gauge,
  GlassWater,
  HeartPulse,
  Moon,
  Mountain,
  PersonStanding,
  Sofa,
  Sun,
  Sunrise,
  Sunset,
  Utensils,
  Wheat,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { GuidanceKey } from '../engine/guidance.ts';
import type { DayLoad } from '../engine/types.ts';
import type { Sport } from '../model/index.ts';

export const SPORT_ICON: Readonly<Record<Sport, LucideIcon>> = {
  ride: Bike,
  run: HeartPulse,
  strength: Dumbbell,
  pilates: PersonStanding,
  walk: Footprints,
  other: Activity,
};

/** Tile classes per sport: one colour each. */
export const SPORT_TONE: Readonly<Record<Sport, string>> = {
  ride: 'bg-amber-400 text-black',
  run: 'bg-rose-400 text-black',
  strength: 'bg-violet-400 text-black',
  pilates: 'bg-teal-300 text-black',
  walk: 'bg-lime-400 text-black',
  other: 'bg-stone-300 text-black',
};

/** Text colour per sport, for small icons such as calendar cells. */
export const SPORT_TEXT: Readonly<Record<Sport, string>> = {
  ride: 'text-amber-700 dark:text-amber-400',
  run: 'text-rose-700 dark:text-rose-400',
  strength: 'text-violet-700 dark:text-violet-400',
  pilates: 'text-teal-700 dark:text-teal-300',
  walk: 'text-lime-700 dark:text-lime-400',
  other: 'text-stone-600 dark:text-stone-300',
};

const GUIDANCE_ICON: Readonly<Record<GuidanceKey, LucideIcon>> = {
  'pre-meal': Zap,
  pre: Zap,
  'pre-snack': Banana,
  during: GlassWater,
  'during-rinse': GlassWater,
  'recovery-meal': BatteryCharging,
  recovery: BatteryCharging,
  'recovery-fast': BatteryCharging,
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

/** Meal card accent: pre-workout amber, during sky, post-workout emerald. */
export function mealTone(guidance: GuidanceKey): {
  /** Icon tile background and text. */
  tile: string;
  /** Background of the strip along the card's left edge. */
  card: string;
} {
  switch (guidance) {
    case 'pre-meal':
    case 'pre':
    case 'pre-snack':
      return { tile: 'bg-amber-400 text-black', card: 'bg-amber-400' };
    case 'during':
    case 'during-rinse':
      return { tile: 'bg-sky-300 text-black', card: 'bg-sky-300' };
    case 'recovery-meal':
    case 'recovery':
    case 'recovery-fast':
      return { tile: 'bg-emerald-300 text-black', card: 'bg-emerald-300' };
    default:
      return { tile: 'bg-stone-200 text-black', card: 'bg-stone-200' };
  }
}

export const LOAD_ICON: Readonly<Record<DayLoad, LucideIcon>> = {
  rest: Sofa,
  light: Feather,
  moderate: Gauge,
  high: Flame,
  'very-high': Mountain,
};

/** Banner classes per day load, calm to loud. */
export const LOAD_TONE: Readonly<Record<DayLoad, string>> = {
  rest: 'bg-stone-200 text-black',
  light: 'bg-teal-300 text-black',
  moderate: 'bg-sky-300 text-black',
  high: 'bg-orange-400 text-black',
  'very-high': 'bg-red-500 text-black',
};

export const TOTAL_ICON = {
  kcal: Flame,
  carb: Wheat,
  protein: Drumstick,
  fat: Droplet,
} as const;
