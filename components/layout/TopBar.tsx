'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';

// Per 06-design-system.md: "Messages/Notifications live in the top bar, not
// competing for bottom-nav slots." A dropdown/popover can replace the plain
// link-to-a-page approach later — this is the first-pass version.
export function TopBar() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    function poll() {
      apiFetch<{ unread_count: number }>('/v1/notifications/unread-count')
        .then((data) => {
          if (!cancelled) setUnreadCount(data.unread_count);
        })
        .catch(() => {
          /* top bar shouldn't break the app if this one call fails */
        });
    }

    poll();
    const interval = setInterval(poll, 30_000); // simple polling — real-time push is Phase 2
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-copper/20 bg-flour px-4 dark:bg-char">
      <Link href="/feed" className="font-display text-lg">
        CookVerse
      </Link>
      <Link
        href="/notifications"
        className="relative flex min-h-[44px] min-w-[44px] items-center justify-center"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Bell className="h-6 w-6" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-chili px-1 font-mono text-[10px] text-flour">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>
    </header>
  );
}
