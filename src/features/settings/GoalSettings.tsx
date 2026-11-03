import { useState } from 'react';
import { todayIn } from '../../app/dates.ts';
import { currentGoal, db, saveGoal, useLiveQuery } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import type { StoredGoal, StoredProfile } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { GoalFields } from '../profile/GoalFields.tsx';
import {
  draftFromGoal,
  goalFromDraft,
  type GoalErrors,
  type GoalDraft,
} from '../profile/profileDraft.ts';
import { SavedNote } from './SavedNote.tsx';
import { useProfile } from './useProfile.ts';

export function GoalSettings() {
  const profile = useProfile();
  const timeZone = profile.loading ? undefined : profile.value?.timeZone;
  const goal = useLiveQuery(
    async () =>
      timeZone ? ((await currentGoal(db, todayIn(timeZone))) ?? null) : null,
    [timeZone],
  );
  return (
    <Screen title={t('goal.title')}>
      <BackLink to="/settings" />
      {!profile.loading && profile.value && !goal.loading && (
        <GoalForm
          key={goal.value?.id ?? 'none'}
          profile={profile.value}
          goal={goal.value ?? undefined}
        />
      )}
    </Screen>
  );
}

function GoalForm({
  profile,
  goal,
}: {
  profile: StoredProfile;
  goal: StoredGoal | undefined;
}) {
  const [draft, setDraft] = useState<GoalDraft>(() => draftFromGoal(goal));
  const [errors, setErrors] = useState<GoalErrors>({});
  const [saved, setSaved] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const result = goalFromDraft(draft, todayIn(profile.timeZone));
        if (!result.ok) {
          setErrors(result.errors);
          setSaved(false);
          return;
        }
        setErrors({});
        void saveGoal(db, result.goal).then(() => {
          setSaved(true);
        });
      }}
    >
      <GoalFields
        draft={draft}
        onChange={(d) => {
          setDraft(d);
          setSaved(false);
        }}
        errors={errors}
        massKg={profile.massKg}
      />
      <div className="mt-6">
        <Button type="submit">{t('common.save')}</Button>
      </div>
      <SavedNote show={saved} />
    </form>
  );
}
