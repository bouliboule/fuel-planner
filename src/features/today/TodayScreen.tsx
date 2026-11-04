import { Link, useSearchParams } from 'react-router';
import { todayIn } from '../../app/dates.ts';
import { sessionEnergy } from '../../engine/energy.ts';
import type { TraceStep, Warning } from '../../engine/trace.ts';
import { addDays, isoWeekday } from '../../engine/week.ts';
import { formatNumber, t, type MessageKey } from '../../i18n/index.ts';
import type { StoredProfile, StoredSession } from '../../model/index.ts';
import { Button } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { describeSession } from '../sessions/describe.ts';
import { energyMethodText } from '../sessions/energyText.ts';
import { useProfile } from '../settings/useProfile.ts';
import { intakeTotals } from '../../engine/intake.ts';
import { AddEatenFood, IntakeComparison, LoggedLine } from './LogControls.tsx';
import { SlotCard } from './SlotCard.tsx';
import { useDayPlan, type DayData } from './useDayPlan.ts';
import { WarningText } from './WarningText.tsx';
import { Why } from './Why.tsx';

export function TodayScreen() {
  const profile = useProfile();
  if (profile.loading || !profile.value) return null;
  return <Today profile={profile.value} />;
}

function Today({ profile }: { profile: StoredProfile }) {
  const [params, setParams] = useSearchParams();
  const today = todayIn(profile.timeZone);
  const date = params.get('date') ?? today;
  const data = useDayPlan(profile, date);
  const go = (days: number) => {
    const next = addDays(date, days);
    setParams(next === today ? {} : { date: next });
  };
  const title =
    date === today
      ? t('tab.today')
      : `${t(`weekday.${String(isoWeekday(date))}` as MessageKey)} ${date}`;

  return (
    <Screen title={title}>
      <div className="mt-1 flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => {
            go(-1);
          }}
        >
          <span aria-label={t('today.prevDay')}>‹</span>
        </Button>
        <span className="text-sm text-slate-500">{date}</span>
        <Button
          variant="secondary"
          onClick={() => {
            go(1);
          }}
        >
          <span aria-label={t('today.nextDay')}>›</span>
        </Button>
      </div>
      {!data.loading && <Day data={data.value} profile={profile} date={date} />}
    </Screen>
  );
}

const rules = (trace: readonly TraceStep[], ids: readonly string[]) =>
  trace.filter((s) => ids.includes(s.ruleId));

function Day({
  data,
  profile,
  date,
}: {
  data: DayData;
  profile: StoredProfile;
  date: string;
}) {
  const { plan, sessions, foods, choices, log } = data;
  const slotIds = new Set(plan.slots.map((s) => s.id));
  const unattached = log.filter(
    (e) => e.slotId === undefined || !slotIds.has(e.slotId),
  );
  const eaten = intakeTotals(log, foods);
  const mass = profile.massKg;
  const slotWarnings = (slotId: string) =>
    plan.warnings.filter(
      (w) => w.values?.slotId === slotId && w.code !== 'slot-gap',
    );
  const dayWarnings = plan.warnings.filter(
    (w) => w.values?.slotId === undefined && w.values?.sessionId === undefined,
  );

  type Item =
    | { kind: 'session'; time: string; session: StoredSession }
    | { kind: 'slot'; time: string; slot: (typeof plan.slots)[number] };
  const items: Item[] = [
    ...sessions.map((s) => ({
      kind: 'session' as const,
      time: s.start,
      session: s,
    })),
    ...plan.slots.map((s) => ({
      kind: 'slot' as const,
      time: s.time,
      slot: s,
    })),
  ].sort(
    (a, b) => a.time.localeCompare(b.time) || (a.kind === 'session' ? -1 : 1),
  );
  // Slots after midnight keep their order at the end of the day.
  const ordered = [
    ...items.filter(
      (i) =>
        i.kind === 'session' ||
        plan.slots.indexOf(i.slot) <= lastSameDay(plan.slots),
    ),
    ...items.filter(
      (i) =>
        i.kind === 'slot' &&
        plan.slots.indexOf(i.slot) > lastSameDay(plan.slots),
    ),
  ];

  return (
    <>
      <section
        aria-label={t('today.kcalTarget')}
        className="mt-4 rounded-lg bg-slate-100 p-4 dark:bg-slate-900"
      >
        <p className="text-sm">
          <span className="rounded bg-amber-600 px-2 py-0.5 text-white">
            {t(`week.load.${plan.load}`)}
          </span>
          {plan.carbLoading && (
            <span className="ml-2">{t('today.carbLoading')}</span>
          )}
        </p>
        <p className="mt-2 text-3xl font-semibold" data-testid="day-kcal">
          {formatNumber(plan.energy.target, 0)} kcal
        </p>
        <Why
          steps={rules(plan.trace, ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'])}
          label="kcal"
        />
        <dl className="mt-2 grid grid-cols-3 gap-2 text-center">
          {(
            [
              ['today.carb', plan.macros.carbG, ['M2', 'T5', 'M3']],
              ['today.protein', plan.macros.proteinG, ['M1']],
              ['today.fat', plan.macros.fatG, ['M3']],
            ] as const
          ).map(([label, grams, ids]) => (
            <div key={label}>
              <dt className="text-xs text-slate-500">{t(label)}</dt>
              <dd className="text-lg font-semibold">
                {formatNumber(grams, 0)} g
              </dd>
              <dd className="text-xs text-slate-500">
                {t('today.perKg', { value: formatNumber(grams / mass, 1) })}
              </dd>
              <dd>
                <Why steps={rules(plan.trace, ids)} />
              </dd>
            </div>
          ))}
        </dl>
        {dayWarnings.map((w, i) => (
          <WarningText key={i} warning={w} />
        ))}
        {log.length > 0 && (
          <IntakeComparison target={plan.macros} eaten={eaten.totals} />
        )}
        {eaten.missingFoodIds.length > 0 && (
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
            {t('log.missingFood')}
          </p>
        )}
      </section>

      {foods.length === 0 && (
        <p className="mt-4 text-sm">
          {t('today.noFoods')}{' '}
          <Link to="/foods" className="text-amber-700 dark:text-amber-400">
            {t('tab.foods')} ›
          </Link>
        </p>
      )}

      <div className="mt-2">
        {ordered.map((item) =>
          item.kind === 'session' ? (
            <SessionCard
              key={`s-${item.session.id}`}
              session={item.session}
              profile={profile}
              warnings={plan.warnings}
            />
          ) : (
            <SlotCard
              key={item.slot.id}
              slot={item.slot}
              date={date}
              foods={foods}
              profile={profile}
              choice={choices[item.slot.id]}
              warnings={slotWarnings(item.slot.id)}
              trace={plan.trace}
              log={log.filter((e) => e.slotId === item.slot.id)}
            />
          ),
        )}
      </div>

      {unattached.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t('log.unattached')}</h2>
          <ul>
            {unattached.map((e) => (
              <LoggedLine
                key={e.id}
                entry={e}
                food={foods.find((f) => f.id === e.foodId)}
              />
            ))}
          </ul>
        </section>
      )}
      <AddEatenFood
        date={date}
        timeZone={profile.timeZone}
        foods={foods}
        slots={plan.slots}
      />
    </>
  );
}

/** Index of the last slot before any slot that wraps past midnight. */
function lastSameDay(slots: readonly { time: string }[]): number {
  let last = slots.length - 1;
  for (let i = 1; i < slots.length; i++) {
    if ((slots[i]?.time ?? '') < (slots[i - 1]?.time ?? '')) {
      last = i - 1;
      break;
    }
  }
  return last;
}

function SessionCard({
  session,
  profile,
  warnings,
}: {
  session: StoredSession;
  profile: StoredProfile;
  warnings: readonly Warning[];
}) {
  const energy = sessionEnergy(session, profile);
  return (
    <article className="mt-3 rounded-lg border-2 border-amber-600 p-4">
      <h3 className="font-semibold">
        <Link to={`/sessions/${session.id}`}>{describeSession(session)}</Link>
      </h3>
      <p className="text-sm">
        {t('today.session', {
          sport: t(`sport.${session.sport}`),
          kcal: formatNumber(energy.kcal, 0),
        })}
      </p>
      <p className="text-sm text-slate-500">{energyMethodText(energy)}</p>
      {warnings
        .filter((w) => w.values?.sessionId === session.id)
        .map((w, i) => (
          <WarningText key={i} warning={w} />
        ))}
      <Why steps={energy.trace} />
    </article>
  );
}
