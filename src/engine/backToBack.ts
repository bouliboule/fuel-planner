// Back-to-back hard sessions (DECISIONS D52, D53). Not a nutrition rule: it
// only warns when a hard ride or hard run sits on the day next to another of
// the same sport, unless the profile allows it.

import type { Profile } from '../model/index.ts';
import { sessionEnergy } from './energy.ts';
import { sessionIntensityBand } from './load.ts';
import type { Warning } from './trace.ts';
import type { PlannedSession } from './types.ts';

export type HardKind = 'ride' | 'run';

/**
 * D52: a ride is hard when its M2 band is high or it is a key session; a
 * run is hard when its run type is intervals or hard long.
 */
export function hardKind(
  session: PlannedSession,
  profile: Profile,
): HardKind | undefined {
  if (session.sport === 'ride') {
    if (session.key) return 'ride';
    const kcal = sessionEnergy(session, profile).kcal;
    return sessionIntensityBand(session, profile, kcal) === 'high'
      ? 'ride'
      : undefined;
  }
  if (session.sport === 'run') {
    return session.runType === 'intervals' || session.runType === 'hard-long'
      ? 'run'
      : undefined;
  }
  return undefined;
}

/** D53: warnings for `session` against the sessions of the days around it. */
export function backToBackWarnings(input: {
  session: PlannedSession;
  dayBefore: readonly PlannedSession[];
  dayAfter: readonly PlannedSession[];
  profile: Profile;
}): Warning[] {
  const { session, profile } = input;
  const kind = hardKind(session, profile);
  if (!kind) return [];
  const allowed =
    kind === 'ride'
      ? profile.allowBackToBackHardRides
      : profile.allowBackToBackHardRuns;
  if (allowed) return [];
  const sameHard = (list: readonly PlannedSession[]) =>
    list.some((s) => s.id !== session.id && hardKind(s, profile) === kind);
  const warnings: Warning[] = [];
  for (const [side, list] of [
    ['before', input.dayBefore],
    ['after', input.dayAfter],
  ] as const) {
    if (sameHard(list)) {
      warnings.push({
        code: `back-to-back-${kind}-${side}`,
        ruleId: 'D53',
        values: { sessionId: session.id },
      });
    }
  }
  return warnings;
}
