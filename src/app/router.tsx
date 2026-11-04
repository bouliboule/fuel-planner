import { createBrowserRouter, Navigate } from 'react-router';
import { CalendarScreen } from '../features/calendar/CalendarScreen.tsx';
import { DayScreen } from '../features/day/DayScreen.tsx';
import { FirstRunScreen } from '../features/onboarding/FirstRunScreen.tsx';
import { BodyMassSettings } from '../features/settings/BodyMassSettings.tsx';
import { CoefficientsSettings } from '../features/settings/CoefficientsSettings.tsx';
import { DataSettings } from '../features/settings/DataSettings.tsx';
import { EatingWindowSettings } from '../features/settings/EatingWindowSettings.tsx';
import { GoalSettings } from '../features/settings/GoalSettings.tsx';
import { ProfileSettings } from '../features/settings/ProfileSettings.tsx';
import { SettingsScreen } from '../features/settings/SettingsScreen.tsx';
import { AppLayout } from './AppLayout.tsx';

// BASE_URL is the Vite `base` ('/fuel-planner/'); the router wants it without
// the trailing slash. The manifest start_url is the base path, which
// redirects to the Day screen, or to first run when there is no profile.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    { path: 'welcome', element: <FirstRunScreen /> },
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="day" replace /> },
        { path: 'day', element: <DayScreen /> },
        { path: 'day/:date', element: <DayScreen /> },
        { path: 'calendar', element: <CalendarScreen /> },
        { path: 'profile', element: <SettingsScreen /> },
        { path: 'profile/details', element: <ProfileSettings /> },
        { path: 'profile/goal', element: <GoalSettings /> },
        { path: 'profile/body-mass', element: <BodyMassSettings /> },
        { path: 'profile/coefficients', element: <CoefficientsSettings /> },
        { path: 'profile/eating-window', element: <EatingWindowSettings /> },
        { path: 'profile/data', element: <DataSettings /> },
        { path: '*', element: <Navigate to="/day" replace /> },
      ],
    },
  ],
  { basename },
);
