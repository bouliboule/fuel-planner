import { t } from '../../i18n/index.ts';
import {
  sportSchema,
  zoneSchema,
  type Sport,
  type Zone,
} from '../../model/index.ts';
import {
  CheckboxField,
  NumberField,
  SelectField,
  TextField,
} from '../../ui/form.tsx';
import {
  MODES_BY_SPORT,
  emptySessionDraft,
  type IntensityMode,
  type SessionDraft,
  type SessionErrors,
} from './sessionDraft.ts';

export function SessionFields({
  draft,
  onChange,
  errors,
}: {
  draft: SessionDraft;
  onChange: (draft: SessionDraft) => void;
  errors: SessionErrors;
}) {
  const set = <K extends keyof SessionDraft>(
    key: K,
    value: SessionDraft[K],
  ) => {
    onChange({ ...draft, [key]: value });
  };
  const modes = MODES_BY_SPORT[draft.sport];
  return (
    <>
      <SelectField
        label={t('session.sport')}
        value={draft.sport}
        onChange={(v) => {
          const sport = v as Sport;
          // A new sport keeps the shared fields and resets the intensity input.
          onChange({
            ...emptySessionDraft(sport),
            title: draft.title,
            start: draft.start,
            durationMin: draft.durationMin,
            indoor: draft.indoor,
            key: draft.key,
          });
        }}
        options={sportSchema.options.map((s) => ({
          value: s,
          label: t(`sport.${s}`),
        }))}
      />
      <TextField
        label={`${t('session.title')} (${t('common.optional')})`}
        value={draft.title}
        onChange={(v) => {
          set('title', v);
        }}
      />
      <TextField
        type="time"
        label={t('session.start')}
        value={draft.start}
        onChange={(v) => {
          set('start', v);
        }}
        error={errors.start}
      />
      <NumberField
        integer
        label={t('session.duration')}
        value={draft.durationMin}
        onChange={(v) => {
          set('durationMin', v);
        }}
        error={errors.durationMin}
      />
      {modes.length > 1 && (
        <SelectField
          label={t('session.intensityInput')}
          value={draft.mode}
          onChange={(v) => {
            set('mode', v as IntensityMode);
          }}
          options={modes.map((m) => ({ value: m, label: t(`mode.${m}`) }))}
        />
      )}
      {draft.mode === 'zone' && (
        <SelectField
          label={t('session.zone')}
          value={draft.zone}
          onChange={(v) => {
            set('zone', v as Zone);
          }}
          options={zoneSchema.options.map((z) => ({
            value: z,
            label: t(`zone.${z}`),
          }))}
        />
      )}
      {draft.mode === 'kj' && (
        <NumberField
          integer
          label={t('session.kj')}
          value={draft.kj}
          onChange={(v) => {
            set('kj', v);
          }}
          error={errors.kj}
        />
      )}
      {draft.mode === 'rpe' && (
        <NumberField
          label={t('session.rpe')}
          value={draft.rpe}
          onChange={(v) => {
            set('rpe', v);
          }}
          hint={t('session.rpeHint')}
          error={errors.rpe}
        />
      )}
      {draft.mode === 'pace' && (
        <TextField
          label={t('session.pace')}
          value={draft.pace}
          onChange={(v) => {
            set('pace', v);
          }}
          hint={t('session.paceHint')}
          error={errors.pace}
        />
      )}
      {draft.mode === 'distance' && (
        <NumberField
          label={t('session.distance')}
          value={draft.distanceKm}
          onChange={(v) => {
            set('distanceKm', v);
          }}
          hint={t('session.distanceHint')}
          error={errors.distanceKm}
        />
      )}
      {draft.mode === 'met' && (
        <>
          <NumberField
            label={t('session.met')}
            value={draft.met}
            onChange={(v) => {
              set('met', v);
            }}
            hint={t('session.metHint')}
            error={errors.met}
          />
          <TextField
            label={`${t('session.compendiumCode')} (${t('common.optional')})`}
            value={draft.compendiumCode}
            onChange={(v) => {
              set('compendiumCode', v);
            }}
          />
        </>
      )}
      <CheckboxField
        label={t('session.indoor')}
        checked={draft.indoor}
        onChange={(v) => {
          set('indoor', v);
        }}
      />
      <CheckboxField
        label={t('session.key')}
        checked={draft.key}
        onChange={(v) => {
          set('key', v);
        }}
      />
    </>
  );
}
