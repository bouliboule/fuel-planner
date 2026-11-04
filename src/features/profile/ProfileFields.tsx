import { useMemo } from 'react';
import { timeZones } from '../../app/dates.ts';
import { t } from '../../i18n/index.ts';
import { Button, NumberField, SelectField, TextField } from '../../ui/form.tsx';
import type { DraftErrors, DraftMeal, ProfileDraft } from './profileDraft.ts';

export function ProfileFields({
  draft,
  onChange,
  errors,
  editMass,
}: {
  draft: ProfileDraft;
  onChange: (draft: ProfileDraft) => void;
  errors: DraftErrors<keyof ProfileDraft>;
  editMass: boolean;
}) {
  const zones = useMemo(() => {
    const all = timeZones();
    return all.includes(draft.timeZone) ? all : [draft.timeZone, ...all];
  }, [draft.timeZone]);
  const set = <K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K],
  ) => {
    onChange({ ...draft, [key]: value });
  };
  const setMeal = (index: number, patch: Partial<DraftMeal>) => {
    set(
      'usualMeals',
      draft.usualMeals.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    );
  };

  return (
    <>
      <SelectField
        label={t('profile.sex')}
        value={draft.sex}
        onChange={(v) => {
          set('sex', v);
        }}
        error={errors.sex}
        options={[
          { value: '', label: t('profile.sex.choose') },
          { value: 'male', label: t('profile.sex.male') },
          { value: 'female', label: t('profile.sex.female') },
        ]}
      />
      <NumberField
        integer
        label={t('profile.birthYear')}
        value={draft.birthYear}
        onChange={(v) => {
          set('birthYear', v);
        }}
        error={errors.birthYear}
      />
      <NumberField
        label={t('profile.heightCm')}
        value={draft.heightCm}
        onChange={(v) => {
          set('heightCm', v);
        }}
        error={errors.heightCm}
      />
      {editMass ? (
        <NumberField
          label={t('profile.massKg')}
          value={draft.massKg}
          onChange={(v) => {
            set('massKg', v);
          }}
          error={errors.massKg}
        />
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          {t('profile.massFromEntries', { mass: draft.massKg })}
        </p>
      )}
      <NumberField
        label={`${t('profile.bodyFatPct')} (${t('common.optional')})`}
        value={draft.bodyFatPct}
        onChange={(v) => {
          set('bodyFatPct', v);
        }}
        hint={t('profile.bodyFatHint')}
        error={errors.bodyFatPct}
      />
      <NumberField
        integer
        label={`${t('profile.ftpW')} (${t('common.optional')})`}
        value={draft.ftpW}
        onChange={(v) => {
          set('ftpW', v);
        }}
        hint={t('profile.ftpHint')}
        error={errors.ftpW}
      />
      <SelectField
        label={t('profile.timeZone')}
        value={draft.timeZone}
        onChange={(v) => {
          set('timeZone', v);
        }}
        options={zones.map((z) => ({ value: z, label: z }))}
        error={errors.timeZone}
      />
      <TextField
        type="time"
        label={t('profile.wakeTime')}
        value={draft.wakeTime}
        onChange={(v) => {
          set('wakeTime', v);
        }}
        error={errors.wakeTime}
      />
      <TextField
        type="time"
        label={t('profile.sleepTime')}
        value={draft.sleepTime}
        onChange={(v) => {
          set('sleepTime', v);
        }}
        error={errors.sleepTime}
      />

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">{t('profile.meals')}</legend>
        {draft.usualMeals.map((meal, i) => (
          <div
            key={i}
            className="mt-2 grid grid-cols-[1fr_8rem_auto] items-end gap-2 border-b border-slate-200 pb-3 dark:border-slate-700"
          >
            <TextField
              label={t('profile.mealName')}
              value={meal.name}
              onChange={(name) => {
                setMeal(i, { name });
              }}
            />
            <TextField
              type="time"
              label={t('profile.mealTime')}
              value={meal.time}
              onChange={(time) => {
                setMeal(i, { time });
              }}
            />
            <Button
              variant="secondary"
              onClick={() => {
                set(
                  'usualMeals',
                  draft.usualMeals.filter((_, j) => j !== i),
                );
              }}
            >
              {t('common.remove')}
            </Button>
            <NumberField
              integer
              label={t('profile.mealKcalMin')}
              value={meal.kcalMin}
              onChange={(kcalMin) => {
                setMeal(i, { kcalMin });
              }}
            />
            <NumberField
              integer
              label={t('profile.mealKcalMax')}
              value={meal.kcalMax}
              onChange={(kcalMax) => {
                setMeal(i, { kcalMax });
              }}
            />
          </div>
        ))}
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {t('profile.mealKcalHint')}
        </p>
        {errors.usualMeals && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.usualMeals}
          </p>
        )}
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() => {
              set('usualMeals', [
                ...draft.usualMeals,
                { name: '', time: '', kcalMin: '', kcalMax: '' },
              ]);
            }}
          >
            {t('profile.addMeal')}
          </Button>
        </div>
      </fieldset>
    </>
  );
}
