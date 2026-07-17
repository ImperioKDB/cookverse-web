'use client';

import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error';

interface ToastState {
  message: string;
  variant: ToastVariant;
}

/**
 * Minimal, self-contained toast — per 06-design-system.md's Forms &
 * Feedback spec: auto-dismiss after 4s, aria-live="polite", never steals
 * focus. Scoped to whichever page renders <Toast />, not a global provider —
 * there's no toast component anywhere else in the app yet (flagged as a gap
 * in 11-design-audit.md), so this is the first one. Promote to a shared
 * provider once a second page needs it rather than building that ahead of
 * actual use.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast({ message, variant });
    timeoutRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const dismissToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  return { toast, showToast, dismissToast };
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastState | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 lg:bottom-6"
    >
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-sm border px-4 py-3 text-sm shadow-lg',
          toast.variant === 'success'
            ? 'border-bay/30 bg-bay/10 text-bay dark:bg-bay/20'
            : 'border-chili/30 bg-chili/10 text-chili'
        )}
      >
        <span>{toast.message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="min-h-[24px] min-w-[24px] shrink-0 text-xs opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
