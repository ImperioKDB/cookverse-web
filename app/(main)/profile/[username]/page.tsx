import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { FollowButton } from '@/components/social/FollowButton';
import { LogoutButton } from '@/components/social/LogoutButton';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import type { RecipeCardData } from '@/lib/types';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skill_level: string;
  follower_count: number;
  following_count: number;
  recipe_count: number;
  is_following: boolean;
}

async function fetchJson<T>(path: string, token: string | undefined): Promise<T | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  const response = await fetch(`${apiUrl}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Profile and recipes don't depend on each other — fetching them
  // sequentially was doubling this page's load time for no reason.
  const [profile, recipesData] = await Promise.all([
    fetchJson<Profile>(`/v1/profiles/${username}`, session?.access_token),
    fetchJson<{ recipes: RecipeCardData[] }>(`/v1/recipes?author=${username}&sort=new`, session?.access_token),
  ]);

  if (!profile) notFound();

  const isOwnProfile = session?.user.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start gap-4">
        {isOwnProfile ? (
          <AvatarUpload initialAvatarUrl={profile.avatar_url} displayName={profile.full_name || profile.username} />
        ) : (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-copper/10">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center font-display text-2xl text-copper/50">
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-display text-2xl">{profile.full_name || `@${profile.username}`}</h1>
          <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">@{profile.username}</p>
          {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
          <div className="mt-2 flex gap-4 font-mono text-sm">
            <span>{profile.recipe_count} recipes</span>
            <span>{profile.follower_count} followers</span>
            <span>{profile.following_count} following</span>
          </div>
        </div>
        {!isOwnProfile && <FollowButton username={profile.username} initialFollowing={profile.is_following} />}
      </div>

      {/* Account actions get their own clearly-spaced row instead of being
          squeezed into the header — that's what was cramped before. */}
      {isOwnProfile && (
        <div className="mt-4 flex items-center justify-between border-y border-copper/15 py-3">
          <Link href="/saved" className="text-sm font-medium text-chili">
            Saved recipes →
          </Link>
          <LogoutButton />
        </div>
      )}

      <h2 className="mt-8 font-display text-xl">Recipes</h2>
      {!recipesData || recipesData.recipes.length === 0 ? (
        <p className="mt-2 text-sm text-[#241E1A]/60 dark:text-flour/60">
          {isOwnProfile ? "You haven't published a recipe yet." : "Nothing published yet."}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {recipesData.recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
