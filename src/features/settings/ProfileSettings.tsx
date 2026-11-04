import { useState } from 'react';
import { db, saveProfile } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { ProfileFields } from '../profile/ProfileFields.tsx';
import {
  draftFromProfile,
  profileFromDraft,
  type DraftErrors,
  type ProfileDraft,
} from '../profile/profileDraft.ts';
import { SavedNote } from './SavedNote.tsx';
import { useProfile } from './useProfile.ts';

export function ProfileSettings() {
  const profile = useProfile();
  return (
    <Screen title={t('profile.title')}>
      <BackLink to="/profile" />
      {!profile.loading && profile.value && (
        <ProfileForm key={profile.value.id} profile={profile.value} />
      )}
    </Screen>
  );
}

function ProfileForm({ profile }: { profile: StoredProfile }) {
  const [draft, setDraft] = useState<ProfileDraft>(() =>
    draftFromProfile(profile),
  );
  const [errors, setErrors] = useState<DraftErrors<keyof ProfileDraft>>({});
  const [saved, setSaved] = useState(false);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = profile;
        const result = profileFromDraft(
          { ...draft, massKg: String(profile.massKg) },
          rest,
        );
        if (!result.ok) {
          setErrors(result.errors);
          setSaved(false);
          return;
        }
        setErrors({});
        void saveProfile(db, result.profile).then(() => {
          setSaved(true);
        });
      }}
    >
      <ProfileFields
        draft={draft}
        onChange={(d) => {
          setDraft(d);
          setSaved(false);
        }}
        errors={errors}
        editMass={false}
      />
      <div className="mt-6">
        <Button type="submit">{t('common.save')}</Button>
      </div>
      <SavedNote show={saved} />
    </form>
  );
}
