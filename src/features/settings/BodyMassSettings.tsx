import { useState } from 'react';
import { todayIn } from '../../app/dates.ts';
import {
  addBodyMass,
  db,
  listBodyMass,
  removeBodyMass,
  useLiveQuery,
} from '../../db/index.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button, NumberField, TextField } from '../../ui/form.tsx';
import { parseNumber } from '../../ui/parse.ts';
import { Screen } from '../../ui/Screen.tsx';
import { MassTrend } from './MassTrend.tsx';
import { useProfile } from './useProfile.ts';

export function BodyMassSettings() {
  const profile = useProfile();
  const entries = useLiveQuery(() => listBodyMass(db), []);
  const timeZone = profile.loading
    ? 'Europe/Paris'
    : (profile.value?.timeZone ?? 'Europe/Paris');
  const [date, setDate] = useState(() => todayIn(timeZone));
  const [mass, setMass] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [errors, setErrors] = useState<{
    date?: string;
    mass?: string;
    bodyFat?: string;
  }>({});

  const list = entries.loading ? [] : entries.value;

  return (
    <Screen title={t('bodyMass.title')}>
      <BackLink to="/profile" />
      <MassTrend values={list.map((e) => e.massKg)} />
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const massKg = parseNumber(mass);
          const bodyFatPct = parseNumber(bodyFat);
          const next: typeof errors = {};
          if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) next.date = t('form.check');
          if (massKg === undefined) next.mass = t('form.required');
          else if (!(massKg > 0)) next.mass = t('form.check');
          if (
            bodyFatPct !== undefined &&
            !(bodyFatPct >= 0 && bodyFatPct <= 100)
          ) {
            next.bodyFat = t('form.check');
          }
          setErrors(next);
          if (Object.keys(next).length > 0 || massKg === undefined) return;
          void addBodyMass(db, {
            date,
            massKg,
            ...(bodyFatPct === undefined ? {} : { bodyFatPct }),
          }).then(() => {
            setMass('');
            setBodyFat('');
          });
        }}
      >
        <TextField
          type="date"
          label={t('bodyMass.date')}
          value={date}
          onChange={setDate}
          error={errors.date}
        />
        <NumberField
          label={t('bodyMass.massKg')}
          value={mass}
          onChange={setMass}
          error={errors.mass}
        />
        <NumberField
          label={`${t('bodyMass.bodyFatPct')} (${t('common.optional')})`}
          value={bodyFat}
          onChange={setBodyFat}
          hint={t('bodyMass.bodyFatHint')}
          error={errors.bodyFat}
        />
        <div className="mt-4">
          <Button type="submit">{t('bodyMass.add')}</Button>
        </div>
      </form>

      <h2 className="mt-6 text-lg font-black">{t('bodyMass.entries')}</h2>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">{t('bodyMass.empty')}</p>
      ) : (
        <ul className="mt-2 divide-y-2 divide-edge">
          {[...list].reverse().map((entry) => (
            <li
              key={entry.id}
              className="flex min-h-12 items-center justify-between gap-2"
            >
              <span>
                {entry.date} · {formatNumber(entry.massKg)} kg
                {entry.bodyFatPct === undefined
                  ? ''
                  : ` · ${formatNumber(entry.bodyFatPct)} %`}
              </span>
              <Button
                variant="secondary"
                onClick={() => {
                  void removeBodyMass(db, entry.id);
                }}
              >
                {t('common.remove')}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
