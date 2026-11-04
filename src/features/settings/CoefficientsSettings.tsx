import { useState } from 'react';
import {
  DURING_G_PER_H_OVERRIDE_MAX,
  GROSS_EFFICIENCY_RANGE,
  NEA_FACTOR_RANGE,
  PROTEIN_G_PER_KG_RANGE,
} from '../../engine/constants.ts';
import { db, saveProfile } from '../../db/index.ts';
import { t, type MessageKey } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button, NumberField } from '../../ui/form.tsx';
import { parseNumber } from '../../ui/parse.ts';
import { Screen } from '../../ui/Screen.tsx';
import { SavedNote } from './SavedNote.tsx';
import { useProfile } from './useProfile.ts';

interface Coefficient {
  key:
    | 'neaFactor'
    | 'grossEfficiency'
    | 'proteinGPerKg'
    | 'carbPointInRange'
    | 'onBikeCarbTargetGPerH';
  label: MessageKey;
  hint?: MessageKey;
  range: readonly [number, number];
  optional?: boolean;
}

// Ranges from docs/DOMAIN.md via the engine constants.
const coefficients: readonly Coefficient[] = [
  {
    key: 'neaFactor',
    label: 'coefficients.nea',
    hint: 'coefficients.neaHint',
    range: NEA_FACTOR_RANGE,
  },
  {
    key: 'grossEfficiency',
    label: 'coefficients.efficiency',
    range: GROSS_EFFICIENCY_RANGE,
  },
  {
    key: 'proteinGPerKg',
    label: 'coefficients.protein',
    range: PROTEIN_G_PER_KG_RANGE,
  },
  {
    key: 'carbPointInRange',
    label: 'coefficients.carbPoint',
    hint: 'coefficients.carbPointHint',
    range: [0, 1],
  },
  {
    key: 'onBikeCarbTargetGPerH',
    label: 'coefficients.onBike',
    hint: 'coefficients.onBikeHint',
    range: [1, DURING_G_PER_H_OVERRIDE_MAX],
    optional: true,
  },
];

export function CoefficientsSettings() {
  const profile = useProfile();
  return (
    <Screen title={t('coefficients.title')}>
      <BackLink to="/profile" />
      {!profile.loading && profile.value && (
        <CoefficientsForm key={profile.value.id} profile={profile.value} />
      )}
    </Screen>
  );
}

function CoefficientsForm({ profile }: { profile: StoredProfile }) {
  const [values, setValues] = useState<Record<Coefficient['key'], string>>(
    () => ({
      neaFactor: String(profile.neaFactor),
      grossEfficiency: String(profile.grossEfficiency),
      proteinGPerKg: String(profile.proteinGPerKg),
      carbPointInRange: String(profile.carbPointInRange),
      onBikeCarbTargetGPerH:
        profile.onBikeCarbTargetGPerH === undefined
          ? ''
          : String(profile.onBikeCarbTargetGPerH),
    }),
  );
  const [saved, setSaved] = useState(false);

  const errors: Partial<Record<Coefficient['key'], string>> = {};
  for (const c of coefficients) {
    const n = parseNumber(values[c.key]);
    if (n === undefined) {
      if (!c.optional) errors[c.key] = t('form.required');
    } else if (!(n >= c.range[0] && n <= c.range[1])) {
      errors[c.key] = t('form.range', { min: c.range[0], max: c.range[1] });
    }
  }
  const valid = Object.keys(errors).length === 0;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        const { id, createdAt, updatedAt, onBikeCarbTargetGPerH, ...rest } =
          profile;
        const onBike = parseNumber(values.onBikeCarbTargetGPerH);
        void saveProfile(db, {
          ...rest,
          neaFactor: Number(parseNumber(values.neaFactor)),
          grossEfficiency: Number(parseNumber(values.grossEfficiency)),
          proteinGPerKg: Number(parseNumber(values.proteinGPerKg)),
          carbPointInRange: Number(parseNumber(values.carbPointInRange)),
          ...(onBike === undefined ? {} : { onBikeCarbTargetGPerH: onBike }),
        }).then(() => {
          setSaved(true);
        });
      }}
    >
      {coefficients.map((c) => (
        <NumberField
          key={c.key}
          label={
            c.optional ? `${t(c.label)} (${t('common.optional')})` : t(c.label)
          }
          value={values[c.key]}
          onChange={(v) => {
            setValues({ ...values, [c.key]: v });
            setSaved(false);
          }}
          hint={[
            c.hint ? t(c.hint) : '',
            t('form.range', { min: c.range[0], max: c.range[1] }),
          ]
            .filter(Boolean)
            .join(' ')}
          error={errors[c.key]}
        />
      ))}
      <div className="mt-6">
        <Button type="submit" disabled={!valid}>
          {t('common.save')}
        </Button>
      </div>
      <SavedNote show={saved} />
    </form>
  );
}
