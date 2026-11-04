import { useState } from 'react';
import { db, saveProfile } from '../../db/index.ts';
import { t } from '../../i18n/index.ts';
import type { StoredProfile } from '../../model/index.ts';
import { BackLink } from '../../ui/BackLink.tsx';
import { Button, CheckboxField, TextField } from '../../ui/form.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { SavedNote } from './SavedNote.tsx';
import { useProfile } from './useProfile.ts';

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

export function EatingWindowSettings() {
  const profile = useProfile();
  return (
    <Screen title={t('window.title')}>
      <BackLink to="/profile" />
      {!profile.loading && profile.value && (
        <WindowForm key={profile.value.id} profile={profile.value} />
      )}
    </Screen>
  );
}

function WindowForm({ profile }: { profile: StoredProfile }) {
  const [enabled, setEnabled] = useState(profile.eatingWindow !== undefined);
  const [start, setStart] = useState(profile.eatingWindow?.start ?? '');
  const [end, setEnd] = useState(profile.eatingWindow?.end ?? '');
  const [saved, setSaved] = useState(false);
  const startError =
    enabled && !CLOCK.test(start) ? t('form.check') : undefined;
  const endError =
    enabled && (!CLOCK.test(end) || end <= start) ? t('form.check') : undefined;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (startError || endError) return;
        const { id, createdAt, updatedAt, eatingWindow, ...rest } = profile;
        void saveProfile(db, {
          ...rest,
          ...(enabled ? { eatingWindow: { start, end } } : {}),
        }).then(() => {
          setSaved(true);
        });
      }}
    >
      <CheckboxField
        label={t('window.enabled')}
        checked={enabled}
        onChange={(v) => {
          setEnabled(v);
          setSaved(false);
        }}
      />
      {enabled && (
        <>
          <TextField
            type="time"
            label={t('window.start')}
            value={start}
            onChange={setStart}
            error={startError}
          />
          <TextField
            type="time"
            label={t('window.end')}
            value={end}
            onChange={setEnd}
            error={endError}
          />
        </>
      )}
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        {t('window.hint')}
      </p>
      <div className="mt-6">
        <Button type="submit" disabled={Boolean(startError ?? endError)}>
          {t('common.save')}
        </Button>
      </div>
      <SavedNote show={saved} />
    </form>
  );
}
