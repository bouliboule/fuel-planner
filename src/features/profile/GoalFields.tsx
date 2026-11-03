import { LOSE_RATE_MAX_FRACTION_OF_MASS } from '../../engine/constants.ts';
import { formatNumber, t } from '../../i18n/index.ts';
import {
  CheckboxField,
  NumberField,
  SelectField,
  TextField,
} from '../../ui/form.tsx';
import type { DraftErrors, GoalDraft } from './profileDraft.ts';

export function GoalFields({
  draft,
  onChange,
  errors,
  massKg,
}: {
  draft: GoalDraft;
  onChange: (draft: GoalDraft) => void;
  errors: DraftErrors<
    | 'rateKgPerWeek'
    | 'gainKcalPerDay'
    | 'eventName'
    | 'eventDate'
    | 'eventDurationMin'
  >;
  massKg: number | undefined;
}) {
  const set = <K extends keyof GoalDraft>(key: K, value: GoalDraft[K]) => {
    onChange({ ...draft, [key]: value });
  };
  return (
    <>
      <SelectField
        label={t('goal.kind')}
        value={draft.kind}
        onChange={(v) => {
          set('kind', v as GoalDraft['kind']);
        }}
        options={[
          { value: 'maintain', label: t('goal.maintain') },
          { value: 'lose', label: t('goal.lose') },
          { value: 'gain', label: t('goal.gain') },
        ]}
        hint={t('goal.proteinNote')}
      />
      {draft.kind === 'lose' && (
        <NumberField
          label={t('goal.rate')}
          value={draft.rateKgPerWeek}
          onChange={(v) => {
            set('rateKgPerWeek', v);
          }}
          hint={
            massKg === undefined
              ? undefined
              : t('goal.rateCap', {
                  cap: formatNumber(LOSE_RATE_MAX_FRACTION_OF_MASS * massKg, 3),
                  mass: formatNumber(massKg),
                })
          }
          error={errors.rateKgPerWeek}
        />
      )}
      {draft.kind === 'gain' && (
        <NumberField
          integer
          label={t('goal.gainKcal')}
          value={draft.gainKcalPerDay}
          onChange={(v) => {
            set('gainKcalPerDay', v);
          }}
          hint={t('goal.gainHint')}
          error={errors.gainKcalPerDay}
        />
      )}
      <CheckboxField
        label={t('goal.event')}
        checked={draft.hasEvent}
        onChange={(v) => {
          set('hasEvent', v);
        }}
      />
      {draft.hasEvent && (
        <>
          <TextField
            label={t('goal.eventName')}
            value={draft.eventName}
            onChange={(v) => {
              set('eventName', v);
            }}
            error={errors.eventName}
          />
          <TextField
            type="date"
            label={t('goal.eventDate')}
            value={draft.eventDate}
            onChange={(v) => {
              set('eventDate', v);
            }}
            error={errors.eventDate}
          />
          <NumberField
            integer
            label={t('goal.eventDuration')}
            value={draft.eventDurationMin}
            onChange={(v) => {
              set('eventDurationMin', v);
            }}
            hint={t('goal.eventHint')}
            error={errors.eventDurationMin}
          />
        </>
      )}
    </>
  );
}
