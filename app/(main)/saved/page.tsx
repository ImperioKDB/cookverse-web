'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { RecipeGridSkeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { RecipeCardData } from '@/lib/types';

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ recipes: RecipeCardData[] }>('/v1/collections/me/saved')
      .then((data) => setRecipes(data.recipes))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load your saved recipes'))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl">Saved</h1>

      {error && (
        <p role="alert" className="mt-4 text-sm text-chili">
          {error}
        </p>
      )}

      {isLoading && <RecipeGridSkeleton />}

      {!isLoading && !error && recipes.length === 0 && (
        <div className="py-8">
          <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">
            Save your first recipe to start a collection.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/discover">Find a recipe</Link>
          </Button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
