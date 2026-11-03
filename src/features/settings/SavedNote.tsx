import { t } from '../../i18n/index.ts';

export function SavedNote({ show }: { show: boolean }) {
  return show ? (
    <p
      role="status"
      className="mt-2 text-sm text-emerald-700 dark:text-emerald-400"
    >
      {t('common.saved')}
    </p>
  ) : null;
}
