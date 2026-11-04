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
  ride: 'bg-amber-500 text-white',
  run: 'bg-rose-500 text-white',
  strength: 'bg-violet-500 text-white',
  pilates: 'bg-teal-500 text-white',
  walk: 'bg-green-600 text-white',
  other: 'bg-slate-500 text-white',
};

/** Text colour per sport, for small icons such as calendar cells. */
export const SPORT_TEXT: Readonly<Record<Sport, string>> = {
  ride: 'text-amber-600 dark:text-amber-400',
  run: 'text-rose-600 dark:text-rose-400',
  strength: 'text-violet-600 dark:text-violet-400',
  pilates: 'text-teal-600 dark:text-teal-400',
  walk: 'text-green-700 dark:text-green-400',
  other: 'text-slate-600 dark:text-slate-400',
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
  tile: string;
  card: string;
} {
  switch (guidance) {
    case 'pre-meal':
    case 'pre':
    case 'pre-snack':
      return {
        tile: 'bg-amber-500 text-white',
        card: 'border-l-amber-500',
      };
    case 'during':
    case 'during-rinse':
      return { tile: 'bg-sky-500 text-white', card: 'border-l-sky-500' };
    case 'recovery-meal':
    case 'recovery':
    case 'recovery-fast':
      return {
        tile: 'bg-emerald-500 text-white',
        card: 'border-l-emerald-500',
      };
    default:
      return {
        tile: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100',
        card: 'border-l-slate-300 dark:border-l-slate-600',
      };
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
  rest: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
  light: 'bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-100',
  moderate: 'bg-sky-50 text-sky-900 dark:bg-sky-950 dark:text-sky-100',
  high: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100',
  'very-high': 'bg-red-600 text-white',
};

export const TOTAL_ICON = {
  kcal: Flame,
  carb: Wheat,
  protein: Drumstick,
  fat: Droplet,
} as const;
