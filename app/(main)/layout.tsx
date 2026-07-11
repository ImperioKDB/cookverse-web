import { AppNav } from '@/components/layout/AppNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <AppNav />
      {/* Bottom padding clears the mobile tab bar; left margin clears the
          desktop sidebar — see AppNav for the breakpoint this switches at. */}
      <main className="pb-20 lg:ml-56 lg:pb-0">{children}</main>
    </div>
  );
}
