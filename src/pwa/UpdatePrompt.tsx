import { useRegisterSW } from 'virtual:pwa-register/react';
import { t } from '../i18n/index.ts';

// Registers the service worker. With registerType 'prompt' a new version
// waits until the user chooses to reload, so a plan on screen never changes
// under them.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 bg-amber-100 px-4 py-2 text-sm text-amber-950 dark:bg-amber-900 dark:text-amber-50"
    >
      <span className="flex-1">{t('update.available')}</span>
      <button
        type="button"
        className="min-h-11 rounded px-3 font-medium"
        onClick={() => {
          setNeedRefresh(false);
        }}
      >
        {t('update.dismiss')}
      </button>
      <button
        type="button"
        className="min-h-11 rounded bg-amber-600 px-3 font-medium text-white"
        onClick={() => {
          void updateServiceWorker(true);
        }}
      >
        {t('update.reload')}
      </button>
    </div>
  );
}
