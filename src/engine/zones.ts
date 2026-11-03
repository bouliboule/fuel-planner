import type { Zone } from '../model/index.ts';
import { ZONE_INTENSITY_FACTOR } from './constants.ts';

const zonesByIf = (Object.entries(ZONE_INTENSITY_FACTOR) as [Zone, number][])
  .slice()
  .sort((a, b) => a[1] - b[1]);

/** E3: the highest zone whose intensity factor is at or below `value`. */
export function zoneForIf(value: number): Zone {
  let zone: Zone = 'Z1';
  for (const [z, factor] of zonesByIf) {
    if (factor <= value) zone = z;
  }
  return zone;
}
