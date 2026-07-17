interface EditorStepIndicatorProps {
  /** 0-indexed current step */
  current: number;
  total: number;
  label: string;
}

/**
 * "Step 3 of 9" in the mono utility face plus a thin chili progress line —
 * per 06-design-system.md's Forms & Feedback spec, not a generic percentage
 * bar. Pinned at the top of the editor alongside the persistent Exit link.
 */
export function EditorStepIndicator({ current, total, label }: EditorStepIndicatorProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="min-w-0 flex-1">
      <p className="font-mono text-xs text-[#241E1A]/60 dark:text-flour/60">
        Step {current + 1} of {total} · {label}
      </p>
      <div className="mt-1 h-[3px] w-full max-w-xs overflow-hidden rounded-full bg-copper/15">
        <div className="h-full bg-chili transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
