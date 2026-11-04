import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  House,
  Plus,
  Sofa,
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';
import { createElement, useState } from 'react';
import { Link, useParams } from 'react-router';
import { addDays, nowClockIn, todayIn } from '../../app/dates.ts';
import type { Warning } from '../../engine/trace.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { StoredProfile, StoredSession } from '../../model/index.ts';
import { Choice } from '../../ui/Choice.tsx';
import {
  LOAD_ICON,
  LOAD_TONE,
  SPORT_ICON,
  SPORT_TONE,
  TOTAL_ICON,
} from '../../ui/icons.ts';
import { describeSession } from '../sessions/describe.ts';
import { useProfile } from '../settings/useProfile.ts';
import { ActivitySheet } from './ActivitySheet.tsx';
import { defaultDay, longDate } from './dayText.ts';
import { MealCard } from './MealCard.tsx';
import { NumberSheet, type DayNumber } from './NumberSheet.tsx';
import { useDay, type DayData } from './useDay.ts';
import { WarningText } from './WarningText.tsx';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Home (today or tomorrow) at `/day`, any date at `/day/:date`. */
export function DayScreen() {
  const profile = useProfile();
  const { date } = useParams();
  if (profile.loading || !profile.value) return null;
  return (
    <Day
      key={date ?? 'home'}
      profile={profile.value}
      fixedDate={date && ISO_DATE.test(date) ? date : undefined}
    />
  );
}

type Editing = { session?: StoredSession } | undefined;

const headerButton =
  'inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 text-base font-medium dark:border-slate-700';

function Day({
  profile,
  fixedDate,
}: {
  profile: StoredProfile;
  fixedDate: string | undefined;
}) {
  const [which, setWhich] = useState<'today' | 'tomorrow'>(() =>
    defaultDay(profile.usualMeals, nowClockIn(profile.timeZone)),
  );
  const today = todayIn(profile.timeZone);
  const date = fixedDate ?? (which === 'today' ? today : addDays(today, 1));
  const day = useDay(profile, date);
  const [editing, setEditing] = useState<Editing>();
  const [detail, setDetail] = useState<DayNumber | undefined>();

  return (
    <section className="py-4">
      <header className="flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow">
            <UtensilsCrossed
              aria-hidden="true"
              className="size-6"
              strokeWidth={2.5}
            />
          </span>
          {t('app.name')}
        </h1>
        <nav className="flex gap-2">
          <Link
            to="/calendar"
            className={headerButton}
            aria-label={t('nav.calendar')}
          >
            <CalendarDays aria-hidden="true" className="size-5" />
          </Link>
          <Link
            to="/profile"
            className={headerButton}
            aria-label={t('nav.profile')}
          >
            <UserRound aria-hidden="true" className="size-5" />
          </Link>
        </nav>
      </header>

      {fixedDate ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Link
              to={`/day/${addDays(fixedDate, -1)}`}
              className="grid size-12 place-items-center rounded-xl border border-slate-300 dark:border-slate-700"
              aria-label={t('day.previous')}
            >
              <ChevronLeft aria-hidden="true" className="size-6" />
            </Link>
            <p className="text-center text-xl font-bold">{longDate(date)}</p>
            <Link
              to={`/day/${addDays(fixedDate, 1)}`}
              className="grid size-12 place-items-center rounded-xl border border-slate-300 dark:border-slate-700"
              aria-label={t('day.next')}
            >
              <ChevronRight aria-hidden="true" className="size-6" />
            </Link>
          </div>
          <Link
            to="/day"
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-amber-700 dark:text-amber-400"
          >
            <House aria-hidden="true" className="size-5" />
            {t('nav.home')}
          </Link>
        </>
      ) : (
        <>
          <Choice
            label={t('day.which')}
            value={which}
            options={[
              { value: 'today', label: t('day.today') },
              { value: 'tomorrow', label: t('day.tomorrow') },
            ]}
            onChange={setWhich}
          />
          <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
            {longDate(date)}
          </p>
        </>
      )}

      {!day.loading && (
        <DayBody
          data={day.value}
          onAdd={() => {
            setEditing({});
          }}
          onEdit={(session) => {
            setEditing({ session });
          }}
          onDetail={setDetail}
        />
      )}

      {editing && !day.loading && (
        <ActivitySheet
          key={editing.session?.id ?? 'new'}
          date={date}
          existing={editing.session}
          profile={profile}
          dayBefore={day.value.dayBefore}
          dayAfter={day.value.dayAfter}
          onClose={() => {
            setEditing(undefined);
          }}
        />
      )}
      {detail && !day.loading && (
        <NumberSheet
          which={detail}
          plan={day.value.plan}
          profile={profile}
          onClose={() => {
            setDetail(undefined);
          }}
        />
      )}
    </section>
  );
}

const g = (v: number) => formatNumber(v, 0);

const sectionTitle =
  'mt-8 text-sm font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400';

function DayBody({
  data,
  onAdd,
  onEdit,
  onDetail,
}: {
  data: DayData;
  onAdd: () => void;
  onEdit: (session: StoredSession) => void;
  onDetail: (which: DayNumber) => void;
}) {
  const { plan, sessions } = data;
  const bySlot = (id: string) =>
    plan.warnings.filter((w) => w.values?.slotId === id);
  const bySession = (id: string) => [
    ...plan.warnings.filter(
      (w) => w.values?.sessionId === id && w.values.slotId === undefined,
    ),
    ...(data.backToBack.get(id) ?? []),
  ];
  const dayWarnings = plan.warnings.filter(
    (w: Warning) =>
      w.values?.slotId === undefined && w.values?.sessionId === undefined,
  );
  const kcalBySession = new Map(
    plan.energy.exercise.map((e) => [e.sessionId, e.kcal]),
  );
  const durationOf = (id: string | undefined) =>
    sessions.find((s) => s.id === id)?.durationMin;

  return (
    <>
      <h2 className={sectionTitle}>{t('day.activities')}</h2>
      {sessions.length === 0 ? (
        <p className="mt-2 flex items-center gap-3 text-xl font-semibold">
          <span className="grid size-12 place-items-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-100">
            <Sofa aria-hidden="true" className="size-7" />
          </span>
          {t('day.rest')}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onEdit(s);
                }}
                aria-label={t('day.editActivity', {
                  name: describeSession(s),
                })}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="flex items-start gap-3">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl ${SPORT_TONE[s.sport]}`}
                  >
                    {createElement(SPORT_ICON[s.sport], {
                      'aria-hidden': true,
                      className: 'size-7',
                      strokeWidth: 2.25,
                    })}
                  </span>
                  <span className="flex-1">
                    <span className="block text-xl font-semibold">
                      {describeSession(s)}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-base text-slate-600 dark:text-slate-300">
                      {t('day.activityKcal', {
                        kcal: g(kcalBySession.get(s.id) ?? 0),
                      })}
                      {data.hard.has(s.id) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-sm font-bold text-white uppercase">
                          <Flame aria-hidden="true" className="size-4" />
                          {t('day.hard')}
                        </span>
                      )}
                    </span>
                  </span>
                </span>
              </button>
              {bySession(s.id).map((w, i) => (
                <WarningText key={i} warning={w} />
              ))}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-xl font-bold text-white shadow"
      >
        <Plus aria-hidden="true" className="size-6" strokeWidth={2.75} />
        {t('day.addActivity')}
      </button>

      <h2 className={sectionTitle}>{t('day.totals')}</h2>
      <div
        className={`mt-2 flex items-center gap-3 rounded-2xl p-4 ${LOAD_TONE[plan.load]}`}
        data-testid="day-load"
      >
        {createElement(LOAD_ICON[plan.load], {
          'aria-hidden': true,
          className: 'size-9 shrink-0',
          strokeWidth: 2.25,
        })}
        <div>
          <p className="text-xl font-black uppercase">
            {t(`day.load.${plan.load}`)}
          </p>
          <p className="text-base">{t(`day.loadHint.${plan.load}`)}</p>
        </div>
      </div>
      {plan.carbLoading && (
        <p className="mt-2 font-semibold">{t('day.carbLoading')}</p>
      )}
      <button
        type="button"
        onClick={() => {
          onDetail('kcal');
        }}
        className="mt-3 block text-left"
        data-testid="day-kcal"
      >
        <TOTAL_ICON.kcal
          aria-hidden="true"
          className="mr-2 inline size-9 align-[-0.15em] text-orange-500"
        />
        <span className="text-5xl font-black tabular-nums">
          {g(plan.macros.kcal)}
        </span>{' '}
        <span className="text-2xl">{t('day.kcal')}</span>
      </button>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ['carb', plan.macros.carbG, 'text-amber-600'],
            ['protein', plan.macros.proteinG, 'text-rose-600'],
            ['fat', plan.macros.fatG, 'text-sky-600'],
          ] as const
        ).map(([key, grams, tone]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              onDetail(key);
            }}
            className="rounded-2xl bg-slate-100 p-3 text-left dark:bg-slate-900"
            data-testid={`day-${key}`}
          >
            <span className="flex items-center gap-1 text-base font-medium">
              {createElement(TOTAL_ICON[key], {
                'aria-hidden': true,
                className: `size-5 ${tone}`,
              })}
              {t(`day.${key}`)}
            </span>
            <span className="block text-2xl font-bold tabular-nums">
              {t('day.grams', { grams: g(grams) })}
            </span>
          </button>
        ))}
      </div>
      {dayWarnings.map((w, i) => (
        <WarningText key={i} warning={w} />
      ))}

      <h2 className={sectionTitle}>{t('day.meals')}</h2>
      <ul className="mt-2 space-y-3">
        {plan.slots.map((slot) => (
          <MealCard
            key={slot.id}
            slot={slot}
            durationMin={durationOf(slot.sessionId)}
            warnings={bySlot(slot.id)}
          />
        ))}
      </ul>
    </>
  );
}
