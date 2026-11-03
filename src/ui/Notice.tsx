import { t } from '../i18n/index.ts';

export function MedicalNotice() {
  return (
    <aside className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950">
      <h2 className="font-semibold">{t('notice.title')}</h2>
      <p className="mt-1">{t('notice.body')}</p>
    </aside>
  );
}
