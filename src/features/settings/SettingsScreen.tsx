import { useState } from 'react';
import { Link } from 'react-router';
import { t, type MessageKey } from '../../i18n/index.ts';
import { Button } from '../../ui/form.tsx';
import { MedicalNotice } from '../../ui/Notice.tsx';
import { BackLink } from '../../ui/BackLink.tsx';
import { Screen } from '../../ui/Screen.tsx';
import { SkipBreakfast } from './SkipBreakfast.tsx';
import { useProfile } from './useProfile.ts';

const sections: readonly { to: string; label: MessageKey }[] = [
  { to: 'details', label: 'profile.title' },
  { to: 'goal', label: 'goal.title' },
  { to: 'body-mass', label: 'bodyMass.title' },
  { to: 'coefficients', label: 'coefficients.title' },
  { to: 'eating-window', label: 'window.title' },
  { to: 'data', label: 'data.title' },
];

export function SettingsScreen() {
  const [updateStatus, setUpdateStatus] = useState<MessageKey | undefined>();
  const profile = useProfile();
  return (
    <>
      <BackLink to="/day" />
      <Screen title={t('nav.profile')}>
        <ul className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {sections.map((s) => (
            <li key={s.to}>
              <Link
                to={s.to}
                className="flex min-h-12 items-center justify-between px-4"
              >
                {t(s.label)}
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
        </ul>

        {!profile.loading && profile.value && (
          <SkipBreakfast profile={profile.value} />
        )}

        <MedicalNotice />

        {!window.matchMedia('(display-mode: standalone)').matches && (
          <>
            <h2 className="mt-6 text-lg font-semibold">{t('install.title')}</h2>
            <p className="mt-1 text-sm">{t('install.body')}</p>
          </>
        )}

        <h2 className="mt-6 text-lg font-semibold">{t('settings.about')}</h2>
        <p className="mt-1 text-sm">
          {t('settings.version', { version: __APP_VERSION__ })}
        </p>
        <div className="mt-2">
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.serviceWorker
                .getRegistration()
                .then(async (registration) => {
                  if (!registration) {
                    setUpdateStatus('settings.updateUnavailable');
                    return;
                  }
                  await registration.update();
                  setUpdateStatus('settings.updateChecked');
                })
                .catch(() => {
                  setUpdateStatus('settings.updateUnavailable');
                });
            }}
          >
            {t('settings.checkUpdate')}
          </Button>
        </div>
        {updateStatus && (
          <p role="status" className="mt-2 text-sm">
            {t(updateStatus)}
          </p>
        )}
      </Screen>
    </>
  );
}
