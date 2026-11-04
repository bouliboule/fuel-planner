import { Fuel, Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { addDays, nowClockIn, todayIn } from '../../app/dates.ts';
import type { Warning } from '../../engine/trace.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { StoredProfile, StoredSession } from '../../model/index.ts';
import { Choice } from '../../ui/Choice.tsx';
import { SPORT_ICON, TOTAL_ICON } from '../../ui/icons.ts';
import { describeSession } from '../sessions/describe.ts';
import { useProfile } from '../settings/useProfile.ts';
import { ActivitySheet } from './ActivitySheet.tsx';
import { defaultDay } from './dayText.ts';
import { MealCard } from './MealCard.tsx';
import { NumberSheet, type DayNumber } from './NumberSheet.tsx';
import { useDay, type DayData } from './useDay.ts';
import { WarningText } from './WarningText.tsx';

export function DayScreen() {
  const profile = useProfile();
  if (profile.loading || !profile.value) return null;
  return <Day profile={profile.value} />;
}

type Editing = { session?: StoredSession } | undefined;

function Day({ profile }: { profile: StoredProfile }) {
  const [which, setWhich] = useState<'today' | 'tomorrow'>(() =>
    defaultDay(profile.usualMeals, nowClockIn(profile.timeZone)),
  );
  const today = todayIn(profile.timeZone);
  const date = which === 'today' ? today : addDays(today, 1);
  const day = useDay(profile, date);
  const [editing, setEditing] = useState<Editing>();
  const [detail, setDetail] = useState<DayNumber | undefined>();

  return (
    <section className="py-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <span className="grid size-11 place-items-center rounded-xl bg-amber-600 text-white">
            <Fuel aria-hidden="true" className="size-6" />
          </span>
          {t('app.name')}
        </h1>
        <Link
          to="/profile"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-4 text-lg dark:border-slate-700"
        >
          <UserRound aria-hidden="true" className="size-5" />
          {t('nav.profile')}
        </Link>
      </header>
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

      {editing && (
        <ActivitySheet
          key={editing.session?.id ?? 'new'}
          date={date}
          existing={editing.session}
          profile={profile}
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
  const bySession = (id: string) =>
    plan.warnings.filter(
      (w) => w.values?.sessionId === id && w.values.slotId === undefined,
    );
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
      <h2 className="mt-6 text-lg font-semibold text-slate-500 dark:text-slate-400">
        {t('day.activities')}
      </h2>
      {sessions.length === 0 ? (
        <p className="mt-2 text-xl">{t('day.rest')}</p>
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
                className="w-full rounded-2xl border border-slate-200 p-4 text-left dark:border-slate-800"
              >
                <span className="flex items-start gap-3">
                  <SportIcon sport={s.sport} />
                  <span>
                    <span className="block text-xl font-semibold">
                      {describeSession(s)}
                    </span>
                    <span className="block text-base text-slate-600 dark:text-slate-300">
                      {t('day.activityKcal', {
                        kcal: g(kcalBySession.get(s.id) ?? 0),
                      })}
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
        className="mt-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-600 text-xl font-semibold text-white"
      >
        <Plus aria-hidden="true" className="size-6" />
        {t('day.addActivity')}
      </button>

      <h2 className="mt-8 text-lg font-semibold text-slate-500 dark:text-slate-400">
        {t('day.totals')}
      </h2>
      {plan.carbLoading && (
        <p className="mt-1 font-medium">{t('day.carbLoading')}</p>
      )}
      <button
        type="button"
        onClick={() => {
          onDetail('kcal');
        }}
        className="mt-1 block text-left"
        data-testid="day-kcal"
      >
        <TOTAL_ICON.kcal
          aria-hidden="true"
          className="mr-2 inline size-9 align-[-0.15em] text-orange-500"
        />
        <span className="text-5xl font-bold tabular-nums">
          {g(plan.macros.kcal)}
        </span>{' '}
        <span className="text-2xl">{t('day.kcal')}</span>
      </button>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(
          [
            ['carb', plan.macros.carbG],
            ['protein', plan.macros.proteinG],
            ['fat', plan.macros.fatG],
          ] as const
        ).map(([key, grams]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              onDetail(key);
            }}
            className="rounded-2xl bg-slate-100 p-3 text-left dark:bg-slate-900"
            data-testid={`day-${key}`}
          >
            <span className="flex items-center gap-1 text-base">
              <MacroIcon which={key} />
              {t(`day.${key}`)}
            </span>
            <span className="block text-2xl font-semibold tabular-nums">
              {t('day.grams', { grams: g(grams) })}
            </span>
          </button>
        ))}
      </div>
      {dayWarnings.map((w, i) => (
        <WarningText key={i} warning={w} />
      ))}

      <h2 className="mt-8 text-lg font-semibold text-slate-500 dark:text-slate-400">
        {t('day.meals')}
      </h2>
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

function SportIcon({ sport }: { sport: StoredSession['sport'] }) {
  const Icon = SPORT_ICON[sport];
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
      <Icon aria-hidden="true" className="size-6" />
    </span>
  );
}

function MacroIcon({ which }: { which: 'carb' | 'protein' | 'fat' }) {
  const Icon = TOTAL_ICON[which];
  return <Icon aria-hidden="true" className="size-4 text-slate-500" />;
}

/** "Thursday 5 November", in the UI language. */
function longDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1)));
}
