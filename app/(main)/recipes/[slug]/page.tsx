import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RecipeDetailClient } from './RecipeDetailClient';
import type { RecipeDetail } from '@/lib/types';

async function fetchRecipe(slug: string): Promise<RecipeDetail | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/v1/recipes/${slug}`, {
    headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
    cache: 'no-store',
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to load recipe (${response.status})`);
  return response.json();
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = await fetchRecipe(slug);

  if (!recipe) notFound();

  return <RecipeDetailClient recipe={recipe} />;
}
