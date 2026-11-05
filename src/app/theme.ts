/**
 * Colour theme. A per-device preference in localStorage, not in the profile,
 * so it can be read synchronously before first paint (index.html applies it
 * with the same key and rules). "system" follows prefers-color-scheme.
 */

export const themes = ['system', 'light', 'dark'] as const;
export type Theme = (typeof themes)[number];

/** Must match the inline script in index.html. */
const THEME_KEY = 'fuel-planner:theme';

const darkQuery = '(prefers-color-scheme: dark)';

function isTheme(value: unknown): value is Theme {
  return themes.includes(value as Theme);
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return isTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/** Sets the `dark` class and `color-scheme` on <html> for a theme. */
export function applyTheme(theme: Theme): void {
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia(darkQuery).matches);
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
}

export function saveTheme(theme: Theme): void {
  try {
    if (theme === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage unavailable: the choice still applies for this page load.
  }
  applyTheme(theme);
}

/** Applies the stored theme and follows system changes while on "system". */
export function initTheme(): void {
  applyTheme(readTheme());
  window.matchMedia(darkQuery).addEventListener('change', () => {
    applyTheme(readTheme());
  });
}
