import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { todayIn } from '../../app/dates.ts';
import { addDays, isoWeekday, weekDates } from '../../engine/week.ts';
import {
  applyTemplateToWeek,
  db,
  listTemplates,
  useLiveQuery,
  type StoredWeekTemplate,
} from '../../db/index.ts';
import { formatNumber, t, type MessageKey } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { Button, SelectField } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { describeSession } from '../sessions/describe.ts';
import { useProfile } from '../settings/useProfile.ts';
import { useWeekData } from './useWeekData.ts';

export function WeekScreen() {
  const profile = useProfile();
  if (profile.loading || !profile.value) return null;
  return <Week profile={profile.value} />;
}

function Week({ profile }: { profile: StoredProfile }) {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? todayIn(profile.timeZone);
  const dates = weekDates(date);
  const week = useWeekData(profile, date);
  const templates = useLiveQuery(() => listTemplates(db), []);
  const go = (days: number) => {
    setParams({ date: addDays(dates[0] ?? date, days) });
  };

  return (
    <Screen title={t('tab.week')}>
      <div className="mt-2 flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={() => {
            go(-7);
          }}
        >
          <span aria-label={t('week.previous')}>‹</span>
        </Button>
        <p className="text-sm font-medium">
          {t('week.range', { from: dates[0] ?? '', to: dates[6] ?? '' })}
        </p>
        <Button
          variant="secondary"
          onClick={() => {
            go(7);
          }}
        >
          <span aria-label={t('week.next')}>›</span>
        </Button>
      </div>

      <ol className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {!week.loading &&
          week.value.map((day) => (
            <li key={day.date}>
              <Link
                to={`/week/${day.date}`}
                className="block min-h-12 px-4 py-3"
                data-testid={`day-${day.date}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {t(`weekday.${String(isoWeekday(day.date))}` as MessageKey)}{' '}
                    <span className="text-sm text-slate-500">
                      {day.date.slice(5)}
                    </span>
                  </span>
                  <span className="text-sm">
                    {t('week.kcal', { kcal: formatNumber(day.targetKcal, 0) })}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <span>
                    {day.sessions.length === 0
                      ? t('week.rest')
                      : day.sessions.map((s) => describeSession(s)).join('; ')}
                  </span>
                  <span className="shrink-0">
                    {t('week.carb', { carb: formatNumber(day.carbGPerKg, 1) })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
      </ol>

      {!templates.loading && (
        <ApplyTemplate
          templates={templates.value}
          date={date}
          sessionCount={
            week.loading
              ? 0
              : week.value.reduce((n, d) => n + d.sessions.length, 0)
          }
        />
      )}
      <p className="mt-4">
        <Link
          to="/templates"
          className="inline-flex min-h-11 items-center text-amber-700 dark:text-amber-400"
        >
          {t('week.templates')} ›
        </Link>
      </p>
    </Screen>
  );
}

function ApplyTemplate({
  templates,
  date,
  sessionCount,
}: {
  templates: StoredWeekTemplate[];
  date: string;
  sessionCount: number;
}) {
  const [selected, setSelected] = useState(templates[0]?.id ?? '');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const template = templates.find((x) => x.id === selected) ?? templates[0];
  if (!template) {
    return (
      <p className="mt-6 text-sm text-slate-500">{t('week.noTemplates')}</p>
    );
  }
  const apply = () => {
    void applyTemplateToWeek(db, template, date).then(() => {
      setConfirming(false);
      setDone(true);
    });
  };
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{t('week.applyTemplate')}</h2>
      <SelectField
        label={t('week.template')}
        value={template.id}
        onChange={(v) => {
          setSelected(v);
          setDone(false);
        }}
        options={templates.map((x) => ({ value: x.id, label: x.name }))}
      />
      {confirming ? (
        <div className="mt-3">
          <p className="text-sm">
            {t('week.applyConfirm', { count: sessionCount })}
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="danger" onClick={apply}>
              {t('week.applyTemplate')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(false);
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <Button
            onClick={() => {
              setDone(false);
              if (sessionCount > 0) setConfirming(true);
              else apply();
            }}
          >
            {t('week.applyTemplate')}
          </Button>
        </div>
      )}
      {done && (
        <p role="status" className="mt-2 text-sm">
          {t('week.applyDone')}
        </p>
      )}
    </section>
  );
}
