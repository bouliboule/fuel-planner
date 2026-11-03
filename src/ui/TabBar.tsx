import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { t, type MessageKey } from '../i18n/index.ts';

interface Tab {
  to: string;
  label: MessageKey;
  icon: ReactNode;
}

// 24x24 stroke icons drawn with currentColor.
const tabs: readonly Tab[] = [
  {
    to: 'today',
    label: 'tab.today',
    icon: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
  },
  {
    to: 'week',
    label: 'tab.week',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    to: 'foods',
    label: 'tab.foods',
    icon: (
      <path d="M3 11h18a9 9 0 0 1-18 0ZM8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4" />
    ),
  },
  {
    to: 'settings',
    label: 'tab.settings',
    icon: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" />
        <circle cx="15" cy="12" r="2" />
        <circle cx="7" cy="18" r="2" />
      </>
    ),
  },
];

export function TabBar() {
  return (
    <nav
      aria-label={t('tabs.label')}
      className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
    >
      <ul className="mx-auto flex max-w-3xl">
        {tabs.map((tab) => (
          <li key={tab.to} className="flex-1">
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {tab.icon}
              </svg>
              {t(tab.label)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
