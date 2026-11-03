// Session intensity bands and day load classification (docs/DOMAIN.md M2).

import type { Profile, Zone } from '../model/index.ts';
import {
  JOG_MET,
  LOAD_HIGH_MIN,
  LOAD_MODERATE_MIN,
  LOAD_VERY_HIGH_MIN,
  MET_HIGH_MIN,
  MET_MODERATE_MIN,
  RPE_HIGH_MIN,
  RPE_MODERATE_MIN,
  RUN_MET,
  RUN_MIN_SPEED_KMH,
} from './constants.ts';
import { step, type TraceStep } from './trace.ts';
import type { DayLoad, IntensityBand, PlannedSession } from './types.ts';
import { zoneForIf } from './zones.ts';

export { zoneForIf };

const BAND_ORDER: readonly IntensityBand[] = ['low', 'moderate', 'high'];

function zoneBand(zone: Zone): IntensityBand {
  if (zone === 'Z1') return 'low';
  if (zone === 'Z2' || zone === 'Z3') return 'moderate';
  return 'high';
}

function metBand(met: number): IntensityBand {
  if (met < MET_MODERATE_MIN) return 'low';
  if (met < MET_HIGH_MIN) return 'moderate';
  return 'high';
}

/**
 * M2: intensity band of one session, from its intensity input. `sessionKcal`
 * is the session's E3/E4 energy, used for kJ input without FTP.
 */
export function sessionIntensityBand(
  session: PlannedSession,
  profile: Profile,
  sessionKcal: number,
): IntensityBand {
  const { intensity, durationMin } = session;
  const hours = durationMin / 60;
  switch (intensity.kind) {
    case 'zone':
      return zoneBand(intensity.zone);
    case 'if':
      return zoneBand(zoneForIf(intensity.value));
    case 'rpe':
      if (intensity.value < RPE_MODERATE_MIN) return 'low';
      if (intensity.value < RPE_HIGH_MIN) return 'moderate';
      return 'high';
    case 'met':
      return metBand(intensity.value);
    case 'kj': {
      if (profile.ftpW !== undefined) {
        const avgPowerW = (intensity.value * 1000) / (durationMin * 60);
        return zoneBand(zoneForIf(avgPowerW / profile.ftpW));
      }
      return metBand(sessionKcal / (profile.massKg * hours) + 1);
    }
    case 'pace': {
      const speedKmh = 3600 / intensity.secPerKm;
      return metBand(speedKmh >= RUN_MIN_SPEED_KMH ? RUN_MET.met : JOG_MET.met);
    }
  }
}

export interface DayLoadResult {
  load: DayLoad;
  totalMin: number;
  highestBand?: IntensityBand;
  trace: TraceStep[];
}

/** M2: day load from total session minutes and the highest band. */
export function classifyDayLoad(
  sessions: readonly { durationMin: number; band: IntensityBand }[],
): DayLoadResult {
  const totalMin = sessions.reduce((sum, s) => sum + s.durationMin, 0);
  if (sessions.length === 0) {
    return {
      load: 'rest',
      totalMin,
      trace: [step('M2', 'Day load: no sessions', { totalMin }, 0)],
    };
  }
  const highestBand = sessions.reduce<IntensityBand>(
    (top, s) =>
      BAND_ORDER.indexOf(s.band) > BAND_ORDER.indexOf(top) ? s.band : top,
    'low',
  );
  let load: DayLoad;
  if (totalMin < LOAD_MODERATE_MIN || highestBand === 'low') load = 'light';
  else if (totalMin < LOAD_HIGH_MIN) load = 'moderate';
  else if (totalMin < LOAD_VERY_HIGH_MIN) load = 'high';
  else load = 'very-high';
  return {
    load,
    totalMin,
    highestBand,
    trace: [
      step('M2', `Day load: ${load}`, { totalMin, highestBand }, totalMin),
    ],
  };
}
