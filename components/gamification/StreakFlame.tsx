import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakFlameProps {
  streak: number;
  className?: string;
}

/**
 * Simple flame-count — per 06-design-system.md: "streak uses a simple
 * flame-count, not a second competing gauge shape." Display-only: the
 * check-in itself fires automatically once per app open (see TopBar), so
 * this isn't a button — it's the always-visible readout per
 * 10-ui-pages-and-layout.md ("the streak flame sits in the top bar, always
 * visible, never buried in a menu"). A 0-day streak renders nothing rather
 * than a flame reading "0" — the empty top bar is the honest state.
 */
export function StreakFlame({ streak, className }: StreakFlameProps) {
  if (streak <= 0) return null;

  return (
    <span
      className={cn('flex items-center gap-1 font-mono text-xs text-turmeric', className)}
      aria-label={`${streak} day cooking streak`}
    >
      <Flame className="h-4 w-4" strokeWidth={1.5} fill="currentColor" aria-hidden="true" />
      {streak}
    </span>
  );
}
