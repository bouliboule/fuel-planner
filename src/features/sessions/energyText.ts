import type { SessionEnergy } from '../../engine/energy.ts';
import { formatNumber, t } from '../../i18n/index.ts';

/** The method line under an energy estimate (power, MET or distance). */
export function energyMethodText(energy: SessionEnergy): string {
  const last = energy.trace.at(-1);
  const work = energy.trace.find((s) => s.label === 'Mechanical work (kJ)');
  if (energy.method === 'power' && work) {
    return t('preview.power', { kj: formatNumber(work.output, 0) });
  }
  if (energy.method === 'met' && last) {
    const code = energy.compendiumCode ? `, ${energy.compendiumCode}` : '';
    return t('preview.met', { met: String(last.inputs.met), code });
  }
  if (energy.method === 'distance' && last) {
    return t('preview.distance', {
      km: formatNumber(Number(last.inputs.km), 2),
    });
  }
  return '';
}
