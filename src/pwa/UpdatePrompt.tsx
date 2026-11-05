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
      className="flex items-center gap-3 border-b-2 border-edge bg-main px-4 py-2 text-sm font-bold text-main-ink"
    >
      <span className="flex-1">{t('update.available')}</span>
      <button
        type="button"
        className="min-h-11 px-3 font-bold underline underline-offset-4"
        onClick={() => {
          setNeedRefresh(false);
        }}
      >
        {t('update.dismiss')}
      </button>
      <button
        type="button"
        className="brutal brutal-press min-h-11 bg-surface px-3 font-bold text-ink"
        onClick={() => {
          void updateServiceWorker(true);
        }}
      >
        {t('update.reload')}
      </button>
    </div>
  );
}
