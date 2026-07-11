'use client';

import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api-client';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { RecipeCardData, Difficulty } from '@/lib/types';

interface Cuisine {
  id: string;
  name: string;
  slug: string;
}

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
];

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | null>(null);
  const [sort, setSort] = useState<'new' | 'trending'>('new');
  const [recipes, setRecipes] = useState<RecipeCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ cuisines: Cuisine[] }>('/v1/cuisines')
      .then((data) => setCuisines(data.cuisines))
      .catch(() => {
        /* filter chips just won't render if this fails — search/browsing
           still works without them, so we don't block the page on it. */
      });
  }, []);

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({ sort, limit: '20' });
    if (query) params.set('q', query);
    if (cuisineFilter) params.set('cuisine', cuisineFilter);
    if (difficultyFilter) params.set('difficulty', difficultyFilter);

    try {
      const data = await apiFetch<{ recipes: RecipeCardData[] }>(`/v1/recipes?${params.toString()}`);
      setRecipes(data.recipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recipes');
    } finally {
      setIsLoading(false);
    }
  }, [query, cuisineFilter, difficultyFilter, sort]);

  useEffect(() => {
    const timeout = setTimeout(loadRecipes, 300); // debounce the search input
    return () => clearTimeout(timeout);
  }, [loadRecipes]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl">Discover</h1>

      <input
        type="search"
        placeholder="Search recipes..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mt-4 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
      />

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {cuisines.map((cuisine) => (
          <button
            key={cuisine.id}
            onClick={() => setCuisineFilter((current) => (current === cuisine.slug ? null : cuisine.slug))}
            className={cn(
              'min-h-[36px] shrink-0 rounded-sm border px-3 py-1 text-sm',
              cuisineFilter === cuisine.slug ? 'border-chili text-chili' : 'border-copper/30'
            )}
          >
            {cuisine.name}
          </button>
        ))}
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => setDifficultyFilter((current) => (current === d.value ? null : d.value))}
            className={cn(
              'min-h-[36px] shrink-0 rounded-sm border px-3 py-1 text-sm',
              difficultyFilter === d.value ? 'border-chili text-chili' : 'border-copper/30'
            )}
          >
            {d.label}
          </button>
        ))}
        <button
          onClick={() => setSort((current) => (current === 'new' ? 'trending' : 'new'))}
          className="ml-auto min-h-[36px] shrink-0 rounded-sm border border-copper/30 px-3 py-1 text-sm"
        >
          Sort: {sort === 'new' ? 'Newest' : 'Trending'}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-6 text-sm text-chili">
          {error}
        </p>
      )}

      {!error && isLoading && (
        <p className="mt-6 text-sm text-[#241E1A]/60 dark:text-flour/60">Loading recipes…</p>
      )}

      {!error && !isLoading && recipes.length === 0 && (
        <p className="mt-6 text-sm text-[#241E1A]/60 dark:text-flour/60">
          Nothing published yet — be the first to share a recipe.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
