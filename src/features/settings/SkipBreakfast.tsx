import { useState } from 'react';
import { db, saveProfile } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { CheckboxField } from '../../ui/form.tsx';

/** Skip-breakfast preference (DOMAIN S4, D49), saved on change. */
export function SkipBreakfast({ profile }: { profile: StoredProfile }) {
  // Local state so the box follows the tap before the save completes.
  const [on, setOn] = useState(profile.skipBreakfast === true);
  // Breakfast is the first usual meal by time; the rule needs two meals.
  const [first, second] = [...profile.usualMeals].sort((a, b) =>
    a.time.localeCompare(b.time),
  );
  if (!first || !second) return null;
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{t('skipBreakfast.title')}</h2>
      <CheckboxField
        label={t('skipBreakfast.label', { meal: first.name })}
        checked={on}
        onChange={(checked) => {
          setOn(checked);
          void saveProfile(db, { ...profile, skipBreakfast: checked });
        }}
      />
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {t('skipBreakfast.hint', { meal: first.name, next: second.name })}
      </p>
    </section>
  );
}
