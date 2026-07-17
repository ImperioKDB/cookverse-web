'use client';

import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Lightweight confirm modal — per 06-design-system.md: 12px radius for
 * sheets/modals, a soft shadow (the one elevation token reserved for
 * anything overlaying content), and a visible cancel affordance always, per
 * the accessibility checklist's "no dead-end flows" rule. No modal/dialog
 * library is in the current dependency set (only @radix-ui/react-slot is
 * installed), so this is a small hand-rolled dialog rather than adding a
 * new dependency for one use — revisit if a second modal need shows up.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-char/50 px-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-lg border border-copper/20 bg-flour p-5 shadow-lg dark:bg-char"
      >
        <h2 id="confirm-dialog-title" className="font-display text-lg">
          {title}
        </h2>
        <p className="mt-2 text-sm text-[#241E1A]/70 dark:text-flour/70">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-sm px-4 text-sm font-medium text-[#241E1A] hover:bg-copper/10 dark:text-flour"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] rounded-sm bg-chili px-4 text-sm font-medium text-flour hover:bg-chili/90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
