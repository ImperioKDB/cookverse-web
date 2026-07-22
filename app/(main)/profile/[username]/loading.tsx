import { ProfileHeaderSkeleton, RecipeGridSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <ProfileHeaderSkeleton />
      <div className="mt-8 h-6 w-24 animate-pulse rounded-sm bg-copper/15" />
      <div className="mt-4">
        <RecipeGridSkeleton count={4} />
      </div>
    </div>
  );
}
