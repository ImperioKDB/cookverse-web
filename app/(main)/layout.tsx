import { AppNav } from '@/components/layout/AppNav';
import { TopBar } from '@/components/layout/TopBar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AppNav />
      {/* lg:pl-60 on TopBar itself clears the sidebar; ml-56 here clears it
          for the main content column too — see AppNav for the breakpoint. */}
      <div className="lg:ml-56">
        <TopBar />
        {/* Bottom padding clears the mobile tab bar. */}
        <main className="pb-20 lg:pb-0">{children}</main>
      </div>
    </div>
  );
}
