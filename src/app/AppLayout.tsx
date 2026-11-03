import { Outlet } from 'react-router';
import { UpdatePrompt } from '../pwa/UpdatePrompt.tsx';
import { TabBar } from '../ui/TabBar.tsx';

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)]">
      <UpdatePrompt />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
