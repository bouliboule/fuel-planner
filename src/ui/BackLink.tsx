import { Link } from 'react-router';
import { t } from '../i18n/index.ts';

export function BackLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center font-bold underline decoration-main decoration-4 underline-offset-4"
    >
      ‹ {t('common.back')}
    </Link>
  );
}
