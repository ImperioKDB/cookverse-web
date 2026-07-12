import { cn } from '@/lib/utils';

/**
 * Base pulsing block. Same bg-copper/10 tone RecipeCard already uses for its
 * image placeholder, so a loading screen and a real one share a surface
 * color instead of the skeleton looking like a different, greyer product.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-copper/10', className)} />;
}

/** Placeholder shaped like a RecipeCard, for the feed's initial load. */
export function RecipeCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-1.5 h-3 w-1/3" />
    </div>
  );
}

/** Placeholder shaped like a notification row. */
export function NotificationRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

/**
 * A row of pill-shaped placeholders standing in for cuisine/filter chips.
 * Varied widths (not one uniform gray bar) so it reads as "chips are about
 * to appear" rather than a generic loading block.
 */
export function ChipsSkeleton({ count = 6 }: { count?: number }) {
  const widths = ['w-16', 'w-20', 'w-14', 'w-24', 'w-16', 'w-20', 'w-14', 'w-20'];
  return (
    <div className="flex flex-wrap gap-2" aria-busy="true" aria-label="Loading options">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('h-9 rounded-sm', widths[i % widths.length])} />
      ))}
    </div>
  );
}

/** Placeholder shaped like a comment row. */
export function CommentRowSkeleton() {
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="mt-1.5 h-3.5 w-5/6" />
    </div>
  );
}
