import { t } from '../../i18n/index.ts';
import type { Session } from '../../model/index.ts';
import { formatPace } from './sessionDraft.ts';

/** One-line summary, e.g. "18:00 Ride · 60 min · Sweet spot". */
export function describeSession(s: Omit<Session, 'date'>): string {
  const parts = [
    `${s.start} ${s.title ?? t(`sport.${s.sport}`)}`,
    t('session.summary.minutes', { minutes: s.durationMin }),
  ];
  const i = s.intensity;
  if (i.kind === 'zone') parts.push(t(`zone.${i.zone}`));
  if (i.kind === 'kj') parts.push(`${String(i.value)} kJ`);
  if (i.kind === 'rpe') parts.push(`RPE ${String(i.value)}`);
  if (i.kind === 'effort') parts.push(t(`effort.${i.value}`));
  if (i.kind === 'met') parts.push(`MET ${String(i.value)}`);
  if (i.kind === 'pace') parts.push(`${formatPace(i.secPerKm)} /km`);
  if (i.kind === 'if') parts.push(`IF ${String(i.value)}`);
  return parts.join(' · ');
}
