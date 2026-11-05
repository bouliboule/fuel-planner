import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { readTheme, saveTheme, type Theme } from '../../app/theme.ts';
import { t } from '../../i18n/index.ts';
import { Choice } from '../../ui/Choice.tsx';

const options: readonly { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: 'system', label: t('theme.system'), icon: Monitor },
  { value: 'light', label: t('theme.light'), icon: Sun },
  { value: 'dark', label: t('theme.dark'), icon: Moon },
];

/** Light, dark or system theme, saved on this device on tap. */
export function ThemeSetting() {
  const [theme, setTheme] = useState<Theme>(readTheme);
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{t('theme.title')}</h2>
      <Choice
        label={t('theme.label')}
        value={theme}
        options={options}
        onChange={(value) => {
          setTheme(value);
          saveTheme(value);
        }}
      />
    </section>
  );
}
