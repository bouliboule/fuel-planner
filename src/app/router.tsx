import { createBrowserRouter, Navigate } from 'react-router';
import { FoodsScreen } from '../features/foods/FoodsScreen.tsx';
import { FirstRunScreen } from '../features/onboarding/FirstRunScreen.tsx';
import { BodyMassSettings } from '../features/settings/BodyMassSettings.tsx';
import { CoefficientsSettings } from '../features/settings/CoefficientsSettings.tsx';
import { DataSettings } from '../features/settings/DataSettings.tsx';
import { EatingWindowSettings } from '../features/settings/EatingWindowSettings.tsx';
import { GoalSettings } from '../features/settings/GoalSettings.tsx';
import { ProfileSettings } from '../features/settings/ProfileSettings.tsx';
import { SettingsScreen } from '../features/settings/SettingsScreen.tsx';
import { TodayScreen } from '../features/today/TodayScreen.tsx';
import { WeekScreen } from '../features/week/WeekScreen.tsx';
import { AppLayout } from './AppLayout.tsx';

// BASE_URL is the Vite `base` ('/fuel-planner/'); the router wants it without
// the trailing slash. The manifest start_url is the base path, which
// redirects to Today, or to first run when there is no profile.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    { path: 'welcome', element: <FirstRunScreen /> },
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="today" replace /> },
        { path: 'today', element: <TodayScreen /> },
        { path: 'week', element: <WeekScreen /> },
        { path: 'foods', element: <FoodsScreen /> },
        { path: 'settings', element: <SettingsScreen /> },
        { path: 'settings/profile', element: <ProfileSettings /> },
        { path: 'settings/goal', element: <GoalSettings /> },
        { path: 'settings/body-mass', element: <BodyMassSettings /> },
        { path: 'settings/coefficients', element: <CoefficientsSettings /> },
        { path: 'settings/eating-window', element: <EatingWindowSettings /> },
        { path: 'settings/data', element: <DataSettings /> },
        { path: '*', element: <Navigate to="today" replace /> },
      ],
    },
  ],
  { basename },
);
