'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { StreakFlame } from '@/components/gamification/StreakFlame';
import { Toast, useToast } from '@/components/ui/toast';
import type { CheckInResponse } from '@/lib/types';

export function TopBar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const { toast, showToast, dismissToast } = useToast();

  useEffect(() => {
    let cancelled = false;

    function poll() {
      apiFetch<{ unread_count: number }>('/v1/notifications?limit=1')
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

  // Fires once per mount — i.e. once per app open, since (main)/layout.tsx
  // persists across client-side nav within the shell. Auto-fire is
  // deliberate, not a placeholder for a tap-to-check-in flow: the
  // backend's own same-day short-circuit in GamificationService.checkIn()
  // is what makes this safe to call unconditionally, and gating it behind
  // a tap would just create a second, UI-side definition of "checked in
  // today" that can drift from profiles.last_active_date. The flame stays
  // a display-only readout (see StreakFlame) — it doesn't trigger this.
  useEffect(() => {
    let cancelled = false;

    apiFetch<CheckInResponse>('/v1/gamification/checkin', { method: 'POST' })
      .then((data) => {
        if (cancelled) return;
        setStreak(data.streak_current);
        if (!data.already_checked_in_today && data.xp_awarded > 0) {
          showToast(`Streak: ${data.streak_current} ${data.streak_current === 1 ? 'day' : 'days'}`);
        }
      })
      .catch(() => {
        /* streak display just won't update this session — a background
           side effect failing silently is better than surfacing an error
           for something the person didn't explicitly ask for */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-copper/20 bg-flour px-4 dark:bg-char">
      <Link href="/feed" className="font-display text-lg">
        CookVerse
      </Link>
      <div className="flex items-center gap-3">
        <StreakFlame streak={streak} />
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
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </header>
  );
}
