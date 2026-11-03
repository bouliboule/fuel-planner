import { createBrowserRouter, Navigate } from 'react-router';
import { FoodsScreen } from '../features/foods/FoodsScreen.tsx';
import { SettingsScreen } from '../features/settings/SettingsScreen.tsx';
import { TodayScreen } from '../features/today/TodayScreen.tsx';
import { WeekScreen } from '../features/week/WeekScreen.tsx';
import { AppLayout } from './AppLayout.tsx';

// BASE_URL is the Vite `base` ('/fuel-planner/'); the router wants it without
// the trailing slash. The manifest start_url is the base path, which
// redirects to Today.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter(
  [
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="today" replace /> },
        { path: 'today', element: <TodayScreen /> },
        { path: 'week', element: <WeekScreen /> },
        { path: 'foods', element: <FoodsScreen /> },
        { path: 'settings', element: <SettingsScreen /> },
        { path: '*', element: <Navigate to="today" replace /> },
      ],
    },
  ],
  { basename },
);
