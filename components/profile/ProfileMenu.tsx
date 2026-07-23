'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MoreVertical, Pencil, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ErrorMessage } from '@/components/ui/error-message';

/**
 * Own-profile account menu. Per the updated Navigation spec (see
 * 06-design-system.md), account-level actions -- Edit Profile, Settings,
 * Logout -- live here instead of inline on the profile page, opened from
 * a MoreVertical trigger in the header. Sheet slides up from the bottom
 * on mobile per the Motion spec's existing rule for modals/sheets; this
 * is the first component in the app to actually implement that (the
 * centered ConfirmDialog/AddToPlanDialog pattern predates it).
 *
 * Logout keeps its own inline error display rather than a toast, since a
 * failed sign-out needs to stay visible until the person notices it --
 * same reasoning LogoutButton already used.
 */
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const router = useRouter();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  async function handleLogout() {
    setIsLoggingOut(true);
    setLogoutError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      setLogoutError(error.message);
      setIsLoggingOut(false);
      return;
    }

    router.push('/login');
    router.refresh();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-[#241E1A] dark:text-flour"
      >
        <MoreVertical className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-char/50 sm:items-center">
          {/* Backdrop click closes -- separate from the sheet itself so a
              tap inside the menu doesn't also dismiss it. */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0"
          />

          <div
            role="menu"
            aria-label="Account menu"
            className="relative w-full max-w-sm rounded-t-lg border border-copper/20 bg-flour p-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] shadow-lg dark:bg-char sm:rounded-lg sm:pb-2"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-copper/30 sm:hidden" aria-hidden="true" />

            <Link
              href="/profile/edit"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-[44px] items-center gap-3 rounded-sm px-3 text-sm font-medium hover:bg-copper/10"
            >
              <Pencil className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              Edit profile
            </Link>

            {/* Not built yet -- disabled-with-title, not a live-looking
                no-op, per this project's established convention. */}
            <button
              type="button"
              disabled
              title="Account settings aren't built yet"
              role="menuitem"
              className="flex min-h-[44px] w-full items-center gap-3 rounded-sm px-3 text-left text-sm font-medium opacity-40"
            >
              <Settings className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              Settings
            </button>

            <div className="my-1 border-t border-copper/15" />

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-sm px-3 text-left text-sm font-medium text-chili hover:bg-chili/10 disabled:opacity-40"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              {isLoggingOut ? 'Logging out…' : 'Log out'}
            </button>

            <ErrorMessage className="px-3 pt-1 text-xs">{logoutError}</ErrorMessage>
          </div>
        </div>
      )}
    </>
  );
}
