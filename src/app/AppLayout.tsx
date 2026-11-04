import { Navigate, Outlet } from 'react-router';
import { db, getProfile, useLiveQuery } from '../db/index.ts';
import { UpdatePrompt } from '../pwa/UpdatePrompt.tsx';

export function AppLayout() {
  const profile = useLiveQuery(() => getProfile(db), []);
  if (profile.loading) return null;
  if (!profile.value) return <Navigate to="/welcome" replace />;
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <UpdatePrompt />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
    </div>
  );
}
