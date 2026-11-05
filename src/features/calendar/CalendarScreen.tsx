import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { createElement } from 'react';
import { Link, useSearchParams } from 'react-router';
import { monthOf, monthWeeks, todayIn } from '../../app/dates.ts';
import { hardKind } from '../../engine/backToBack.ts';
import { db, listSessions, useLiveQuery } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import {
  sportSchema,
  type StoredProfile,
  type StoredSession,
} from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { SPORT_ICON, SPORT_TEXT, SPORT_TONE } from '../../ui/icons.ts';
import { Screen } from '../../ui/Screen.tsx';
import { useProfile } from '../settings/useProfile.ts';

const MONTH = /^\d{4}-\d{2}$/;

const WEEKDAYS = [
  'calendar.weekday.1',
  'calendar.weekday.2',
  'calendar.weekday.3',
  'calendar.weekday.4',
  'calendar.weekday.5',
  'calendar.weekday.6',
  'calendar.weekday.7',
] as const;

/** Month grid of activities; a day opens its Day screen (UX Calendar). */
export function CalendarScreen() {
  const profile = useProfile();
  if (profile.loading || !profile.value) return null;
  return <Calendar profile={profile.value} />;
}

function monthTitle(month: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`));
}

function Calendar({ profile }: { profile: StoredProfile }) {
  const [params] = useSearchParams();
  const today = todayIn(profile.timeZone);
  const asked = params.get('month');
  const month = asked && MONTH.test(asked) ? asked : monthOf(today);
  const weeks = monthWeeks(month);
  const first = weeks[0]?.[0] ?? `${month}-01`;
  const last = weeks.at(-1)?.[6] ?? `${month}-28`;
  const sessions = useLiveQuery(
    () => listSessions(db, first, last),
    [first, last],
  );
  const byDate = new Map<string, StoredSession[]>();
  if (!sessions.loading) {
    for (const s of sessions.value) {
      byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]);
    }
  }
  const inMonth = sessions.loading
    ? []
    : sessions.value.filter((s) => s.date.startsWith(month));

  return (
    <>
      <BackLink to="/day" />
      <Screen title={t('calendar.title')}>
        <div className="mt-4 flex items-center justify-between">
          <Link
            to={`?month=${monthOf(`${month}-01`, -1)}`}
            className="brutal brutal-press grid size-12 place-items-center bg-surface"
            aria-label={t('calendar.previous')}
          >
            <ChevronLeft aria-hidden="true" className="size-6" />
          </Link>
          <h2 className="text-xl font-black" data-testid="calendar-month">
            {monthTitle(month)}
          </h2>
          <Link
            to={`?month=${monthOf(`${month}-01`, 1)}`}
            className="brutal brutal-press grid size-12 place-items-center bg-surface"
            aria-label={t('calendar.next')}
          >
            <ChevronRight aria-hidden="true" className="size-6" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-black tracking-wide text-ink-muted uppercase">
          {WEEKDAYS.map((key) => (
            <span key={key}>{t(key)}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {weeks.flat().map((date) => {
            const own = date.startsWith(month);
            const list = byDate.get(date) ?? [];
            const hard = list.some((s) => hardKind(s, profile));
            return (
              <Link
                key={date}
                to={`/day/${date}`}
                aria-label={t('calendar.open', { date })}
                className={`brutal-flat flex min-h-16 flex-col items-center gap-0.5 p-1 ${
                  own ? 'bg-surface' : 'opacity-40'
                } ${date === today ? 'bg-main! text-main-ink shadow-brutal-sm' : ''}`}
              >
                <span className="flex items-center gap-0.5 text-sm font-black tabular-nums">
                  {Number(date.slice(8))}
                  {hard && (
                    <Flame
                      aria-hidden="true"
                      className="size-3 text-red-600 dark:text-red-400"
                      strokeWidth={3}
                    />
                  )}
                </span>
                <span className="flex flex-wrap justify-center gap-0.5">
                  {list.slice(0, 3).map((s) =>
                    createElement(SPORT_ICON[s.sport], {
                      key: s.id,
                      'aria-hidden': true,
                      // Today's cell is bg-main, where sport colours vanish.
                      className: `size-4 ${date === today ? '' : SPORT_TEXT[s.sport]}`,
                      strokeWidth: 2.5,
                    }),
                  )}
                </span>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-8 inline-block bg-ink px-2 py-0.5 text-sm font-black tracking-wider text-page uppercase">
          {t('calendar.summary')}
        </h2>
        {inMonth.length === 0 ? (
          <p className="mt-2">{t('calendar.none')}</p>
        ) : (
          <ul
            className="mt-2 flex flex-wrap gap-2"
            data-testid="calendar-summary"
          >
            {sportSchema.options.map((sport) => {
              const count = inMonth.filter((s) => s.sport === sport).length;
              if (count === 0) return null;
              return (
                <li
                  key={sport}
                  className={`brutal-flat inline-flex items-center gap-2 px-3 py-1 text-base font-bold shadow-brutal-sm ${SPORT_TONE[sport]}`}
                >
                  {createElement(SPORT_ICON[sport], {
                    'aria-hidden': true,
                    className: 'size-5',
                  })}
                  {t('calendar.count', { count, sport: t(`sport.${sport}`) })}
                </li>
              );
            })}
          </ul>
        )}
      </Screen>
    </>
  );
}
