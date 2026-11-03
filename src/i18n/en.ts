// English UI strings. Every user-visible string goes through `t()` so a
// French dictionary with the same keys can be added later.
export const en = {
  'app.name': 'Fuel Planner',
  'tab.today': 'Today',
  'tab.week': 'Week',
  'tab.foods': 'Foods',
  'tab.settings': 'Settings',
  'tabs.label': 'Main',
  'placeholder.body': 'This screen is not built yet.',
  'update.available': 'A new version is available.',
  'update.reload': 'Reload',
  'update.dismiss': 'Later',
} as const;

export type MessageKey = keyof typeof en;
