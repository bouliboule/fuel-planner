import type { Session } from '../model/index.ts';

// A stored session with its record id, as the engine receives it.
export type PlannedSession = Session & { id: string };

export type IntensityBand = 'low' | 'moderate' | 'high';

export type DayLoad = 'rest' | 'light' | 'moderate' | 'high' | 'very-high';
