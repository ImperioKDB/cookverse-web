import { cn } from '@/lib/utils';

/**
 * Base pulse block — per 06-design-system.md, every skeleton matches its
 * real content's shape exactly (same aspect ratio, same rounded corners)
 * so nothing jumps when the real content resolves.
 */
function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-sm bg-copper/15', className)} />;
}

/** Matches the shape of a cuisine/difficulty filter chip. */
export function ChipSkeleton() {
  return <Pulse className="h-11 w-24" />;
}

export function ChipRowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Loading options" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <ChipSkeleton key={i} />
      ))}
    </div>
  );
}

/** Matches RecipeCard's aspect-[4/5] image + two text lines. */
export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-sm border border-copper/20">
      <Pulse className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Pulse className="h-4 w-3/4" />
        <Pulse className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function RecipeGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-label="Loading recipes" role="status">
      {Array.from({ length: count }).map((_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}
