'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { RecipeCardSkeleton } from '@/components/ui/skeleton';
import type { RecipeCardData } from '@/lib/types';

export default function FeedPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  async function load(nextCursor?: string) {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (nextCursor) params.set('cursor', nextCursor);

      const data = await apiFetch<{ recipes: RecipeCardData[] }>(`/v1/feed?${params.toString()}`);
      setRecipes((current) => (nextCursor ? [...current, ...data.recipes] : data.recipes));
      setHasMore(data.recipes.length === 20);
      if (data.recipes.length > 0) {
        setCursor(data.recipes[data.recipes.length - 1].published_at);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your feed');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ErrorMessage>{error}</ErrorMessage>

      {isLoading && recipes.length === 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading your feed">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecipeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state is an invitation, not an apology — per 06-design-system.md's
          Voice guidelines, and per 13-handoff-feed-and-notifications.md's brief
          for this exact case (not following anyone yet isn't an error). */}
      {!isLoading && !error && recipes.length === 0 && (
        <div className="py-12 text-center">
          <h1 className="font-display text-2xl">Your feed is quiet — for now.</h1>
          <p className="mt-2 text-sm text-[#241E1A]/60 dark:text-flour/60">
            Follow a few cooks and their recipes will start showing up here.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/discover">Find people to follow</Link>
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" isLoading={isLoading} onClick={() => cursor && load(cursor)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
