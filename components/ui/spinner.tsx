import { cn } from '@/lib/utils';

/**
 * A loading indicator, not a generic browser spinner — reuses the Doneness
 * Dial's rounded-arc language (06-design-system.md) so "this is loading"
 * looks like it belongs to CookVerse rather than any other product. A
 * continuously-rotating incomplete ring, same stroke/cap style as the Dial.
 */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin', className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
}
