import { Link } from 'react-router';
import { t } from '../i18n/index.ts';

export function BackLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center text-amber-700 dark:text-amber-400"
    >
      ‹ {t('common.back')}
    </Link>
  );
}
