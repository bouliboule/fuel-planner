import { t } from '../../i18n/index.ts';
import { Screen } from '../../ui/Screen.tsx';

export function WeekScreen() {
  return (
    <Screen title={t('tab.week')}>
      <p className="mt-2 text-slate-500 dark:text-slate-400">
        {t('placeholder.body')}
      </p>
    </Screen>
  );
}
