import { useState } from 'react';
import { nowClockIn } from '../../app/dates.ts';
import type { Slot } from '../../engine/slots.ts';
import {
  db,
  deleteLogEntry,
  logFood,
  updateLoggedGrams,
} from '../../db/index.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import type { StoredFood, StoredLogEntry } from '../../model/index.ts';
import { Button, NumberField, SelectField, TextField } from '../../ui/form.tsx';
import { parseNumber } from '../../ui/parse.ts';

const inputClass =
  'min-h-11 w-20 rounded-lg border border-slate-300 bg-white px-2 text-right dark:border-slate-700 dark:bg-slate-900';

/** Grams of a logged entry, saved when the field loses focus. */
export function LoggedGrams({
  entry,
  name,
}: {
  entry: StoredLogEntry;
  name: string;
}) {
  const [value, setValue] = useState(String(entry.grams));
  return (
    <input
      aria-label={t('log.grams', { name })}
      inputMode="decimal"
      className={inputClass}
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onBlur={() => {
        const grams = parseNumber(value);
        if (grams !== undefined && grams > 0 && grams !== entry.grams) {
          void updateLoggedGrams(db, entry.id, grams);
        } else {
          setValue(String(entry.grams));
        }
      }}
    />
  );
}

/**
 * Tick box for a planned pick: ticking logs the planned grams. The box
 * changes at once; the parent remounts it (key) when the stored entry changes.
 */
export function TickPick({
  slot,
  date,
  foodId,
  grams,
  name,
  entry,
}: {
  slot: Slot;
  date: string;
  foodId: string;
  grams: number;
  name: string;
  entry: StoredLogEntry | undefined;
}) {
  const [checked, setChecked] = useState(entry !== undefined);
  return (
    <input
      type="checkbox"
      className="size-6 shrink-0"
      aria-label={t('log.tick', { name })}
      checked={checked}
      onChange={(e) => {
        setChecked(e.target.checked);
        if (e.target.checked) {
          void logFood(db, {
            date,
            time: slot.time,
            slotKind: slot.kind,
            slotId: slot.id,
            foodId,
            grams,
          });
        } else if (entry) {
          void deleteLogEntry(db, entry.id);
        }
      }}
    />
  );
}

/** Logged entries shown on their own, with grams and a remove button. */
export function LoggedLine({
  entry,
  food,
}: {
  entry: StoredLogEntry;
  food: StoredFood | undefined;
}) {
  const name = food?.name ?? entry.foodId;
  return (
    <li className="flex min-h-11 items-center justify-between gap-2">
      <span>
        {name}{' '}
        <span className="text-xs text-slate-500">· {t('log.notPlanned')}</span>
      </span>
      <span className="flex items-center gap-2">
        <LoggedGrams entry={entry} name={name} />
        <Button
          variant="secondary"
          onClick={() => {
            void deleteLogEntry(db, entry.id);
          }}
        >
          <span aria-label={t('log.remove', { name })}>×</span>
        </Button>
      </span>
    </li>
  );
}

/** Form for eaten foods that were not planned (D38). */
export function AddEatenFood({
  date,
  timeZone,
  foods,
  slots,
}: {
  date: string;
  timeZone: string;
  foods: StoredFood[];
  slots: Slot[];
}) {
  const [foodId, setFoodId] = useState(foods[0]?.id ?? '');
  const [grams, setGrams] = useState('');
  const [time, setTime] = useState(() => nowClockIn(timeZone));
  const [slotId, setSlotId] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [added, setAdded] = useState(false);
  if (foods.length === 0) return null;
  return (
    <form
      noValidate
      className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800"
      onSubmit={(e) => {
        e.preventDefault();
        const g = parseNumber(grams);
        if (
          g === undefined ||
          !(g > 0) ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)
        ) {
          setError(t('form.fixErrors'));
          return;
        }
        const slot = slots.find((s) => s.id === slotId);
        setError(undefined);
        void logFood(db, {
          date,
          time,
          foodId,
          grams: g,
          ...(slot ? { slotId: slot.id, slotKind: slot.kind } : {}),
        }).then(() => {
          setGrams('');
          setAdded(true);
        });
      }}
    >
      <h2 className="text-lg font-semibold">{t('log.add')}</h2>
      <SelectField
        label={t('log.food')}
        value={foodId}
        onChange={(v) => {
          setFoodId(v);
          setAdded(false);
        }}
        options={foods.map((f) => ({ value: f.id, label: f.name }))}
      />
      <NumberField
        label={t('log.gramsField')}
        value={grams}
        onChange={(v) => {
          setGrams(v);
          setAdded(false);
        }}
      />
      <TextField
        type="time"
        label={t('log.time')}
        value={time}
        onChange={setTime}
      />
      <SelectField
        label={t('log.slot')}
        value={slotId}
        onChange={setSlotId}
        options={[
          { value: '', label: t('log.noSlot') },
          ...slots.map((s) => ({
            value: s.id,
            label: `${s.time} ${s.name ?? t(`slot.${s.kind}`)}`,
          })),
        ]}
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="mt-4">
        <Button type="submit">{t('log.add')}</Button>
      </div>
      {added && (
        <p role="status" className="mt-2 text-sm">
          {t('log.added')}
        </p>
      )}
    </form>
  );
}

/** Target, eaten and difference for the day (D38). */
export function IntakeComparison({
  target,
  eaten,
}: {
  target: { kcal: number; carbG: number; proteinG: number; fatG: number };
  eaten: { kcal: number; carbG: number; proteinG: number; fatG: number };
}) {
  const keys = ['kcal', 'carbG', 'proteinG', 'fatG'] as const;
  const labels = {
    kcal: 'log.kcal',
    carbG: 'log.carb',
    proteinG: 'log.protein',
    fatG: 'log.fat',
  } as const;
  const fmt = (n: number) => formatNumber(n, 0);
  return (
    <table
      aria-label={t('log.compare')}
      className="mt-3 w-full text-right text-sm"
    >
      <thead>
        <tr className="text-xs text-slate-500">
          <th scope="col" />
          {keys.map((k) => (
            <th key={k} scope="col">
              {t(labels[k])}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" className="text-left font-normal">
            {t('log.target')}
          </th>
          {keys.map((k) => (
            <td key={k}>{fmt(target[k])}</td>
          ))}
        </tr>
        <tr>
          <th scope="row" className="text-left font-normal">
            {t('log.eaten')}
          </th>
          {keys.map((k) => (
            <td key={k} data-testid={`eaten-${k}`}>
              {fmt(eaten[k])}
            </td>
          ))}
        </tr>
        <tr className="font-medium">
          <th scope="row" className="text-left">
            {t('log.difference')}
          </th>
          {keys.map((k) => {
            const d = eaten[k] - target[k];
            return <td key={k}>{d > 0 ? `+${fmt(d)}` : fmt(d)}</td>;
          })}
        </tr>
      </tbody>
    </table>
  );
}
