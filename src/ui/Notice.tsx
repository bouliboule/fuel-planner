import { t } from '../i18n/index.ts';

export function MedicalNotice() {
  return (
    <aside className="brutal mt-6 bg-main p-4 text-sm text-main-ink">
      <h2 className="font-black uppercase">{t('notice.title')}</h2>
      <p className="mt-1">{t('notice.body')}</p>
    </aside>
  );
}
