import { Link, useParams } from 'react-router';
import { isoWeekday } from '../../engine/week.ts';
import { formatNumber, t, type MessageKey } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { describeSession } from '../sessions/describe.ts';
import { useProfile } from '../settings/useProfile.ts';
import { useWeekData } from './useWeekData.ts';

/** /week/:date */
export function DayScreen() {
  const { date = '' } = useParams();
  const profile = useProfile();
  if (profile.loading || !profile.value) return null;
  return <Day profile={profile.value} date={date} />;
}

function Day({ profile, date }: { profile: StoredProfile; date: string }) {
  const week = useWeekData(profile, date);
  const day = week.loading
    ? undefined
    : week.value.find((d) => d.date === date);
  return (
    <Screen
      title={`${t(`weekday.${String(isoWeekday(date))}` as MessageKey)} ${date}`}
    >
      <BackLink to={`/week?date=${date}`} />
      {day && (
        <p className="mt-2 text-sm">
          {t('week.kcal', { kcal: formatNumber(day.targetKcal, 0) })} ·{' '}
          {t('week.carb', { carb: formatNumber(day.carbGPerKg, 1) })} ·{' '}
          {t(`week.load.${day.load}`)}
        </p>
      )}
      <h2 className="mt-6 text-lg font-semibold">{t('day.sessions')}</h2>
      {day && day.sessions.length === 0 && (
        <p className="mt-2 text-sm text-slate-500">{t('day.empty')}</p>
      )}
      <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
        {day?.sessions.map((s) => (
          <li key={s.id}>
            <Link
              to={`/sessions/${s.id}`}
              className="flex min-h-12 items-center justify-between"
            >
              {describeSession(s)}
              <span aria-hidden="true">›</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-4">
        <Link
          to={`/sessions/new?date=${date}`}
          className="inline-flex min-h-11 items-center rounded-lg bg-amber-600 px-4 font-medium text-white"
        >
          {t('day.add')}
        </Link>
      </p>
    </Screen>
  );
}
