import { createBrowserRouter, Navigate } from 'react-router';
import { CiqualSearchScreen } from '../features/foods/CiqualSearchScreen.tsx';
import { FoodEditorScreen } from '../features/foods/FoodEditorScreen.tsx';
import { FoodsScreen } from '../features/foods/FoodsScreen.tsx';
import { MealTemplateScreen } from '../features/foods/MealTemplateScreen.tsx';
import { OffSearchScreen } from '../features/foods/OffSearchScreen.tsx';
import { SeedFoodsScreen } from '../features/foods/SeedFoodsScreen.tsx';
import { ShoppingScreen } from '../features/week/ShoppingScreen.tsx';
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
import { DayScreen } from '../features/week/DayScreen.tsx';
import { SessionScreen } from '../features/sessions/SessionScreen.tsx';
import { TemplatesScreen } from '../features/templates/TemplatesScreen.tsx';
import { TemplateScreen } from '../features/templates/TemplateScreen.tsx';
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
        { path: 'week/:date', element: <DayScreen /> },
        { path: 'sessions/new', element: <SessionScreen /> },
        { path: 'sessions/:id', element: <SessionScreen /> },
        { path: 'templates', element: <TemplatesScreen /> },
        { path: 'templates/new', element: <TemplateScreen /> },
        { path: 'templates/:id', element: <TemplateScreen /> },
        { path: 'foods', element: <FoodsScreen /> },
        { path: 'foods/new', element: <FoodEditorScreen /> },
        { path: 'foods/ciqual', element: <CiqualSearchScreen /> },
        { path: 'foods/off', element: <OffSearchScreen /> },
        { path: 'foods/seed', element: <SeedFoodsScreen /> },
        { path: 'foods/templates/new', element: <MealTemplateScreen /> },
        { path: 'foods/templates/:id', element: <MealTemplateScreen /> },
        { path: 'foods/:id', element: <FoodEditorScreen /> },
        { path: 'shopping', element: <ShoppingScreen /> },
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
