import { Bike, Coffee, HeartPulse } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { db, updateProfile } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import type { Profile, StoredProfile } from '../../model/index.ts';

type Flag =
  'skipBreakfast' | 'allowBackToBackHardRides' | 'allowBackToBackHardRuns';

/** A preference switch, saved on change (D49, D53). */
function Toggle({
  flag,
  profile,
  label,
  icon,
}: {
  flag: Flag;
  profile: StoredProfile;
  label: string;
  icon: ReactNode;
}) {
  // Local state so the box follows the tap before the save completes.
  const [on, setOn] = useState(profile[flag] === true);
  return (
    <label className="mt-3 flex min-h-12 items-center gap-3 text-base">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800">
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      <input
        type="checkbox"
        className="size-6 accent-orange-600"
        checked={on}
        onChange={(e) => {
          setOn(e.target.checked);
          const patch: Partial<Profile> = { [flag]: e.target.checked };
          void updateProfile(db, patch);
        }}
      />
    </label>
  );
}

/** Meal and training preferences on the Profile screen. */
export function Preferences({ profile }: { profile: StoredProfile }) {
  // Breakfast is the first usual meal by time; the rule needs two meals.
  const [first, second] = [...profile.usualMeals].sort((a, b) =>
    a.time.localeCompare(b.time),
  );
  return (
    <>
      {first && second && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">{t('skipBreakfast.title')}</h2>
          <Toggle
            flag="skipBreakfast"
            profile={profile}
            label={t('skipBreakfast.label', { meal: first.name })}
            icon={<Coffee aria-hidden="true" className="size-5" />}
          />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('skipBreakfast.hint', { meal: first.name, next: second.name })}
          </p>
        </section>
      )}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t('training.title')}</h2>
        <Toggle
          flag="allowBackToBackHardRides"
          profile={profile}
          label={t('training.allowRides')}
          icon={<Bike aria-hidden="true" className="size-5 text-amber-600" />}
        />
        <Toggle
          flag="allowBackToBackHardRuns"
          profile={profile}
          label={t('training.allowRuns')}
          icon={
            <HeartPulse aria-hidden="true" className="size-5 text-rose-600" />
          }
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('training.hint')}
        </p>
      </section>
    </>
  );
}
