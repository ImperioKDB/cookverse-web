import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Bookmark, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { FollowButton } from '@/components/social/FollowButton';
import { ProfileMenu } from '@/components/profile/ProfileMenu';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { RecipeCard } from '@/components/recipe/RecipeCard';
import { XPRing } from '@/components/gamification/XPRing';
import type { GamificationSummary, RecipeCardData } from '@/lib/types';

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

  const [profile, recipesData, gamification] = await Promise.all([
    fetchJson<Profile>(`/v1/profiles/${username}`, session?.access_token),
    fetchJson<{ recipes: RecipeCardData[] }>(`/v1/recipes?author=${username}&sort=new`, session?.access_token),
    session
      ? fetchJson<GamificationSummary>('/v1/gamification/me', session.access_token)
      : Promise.resolve(null),
  ]);

  if (!profile) notFound();

  const isOwnProfile = session?.user.id === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header: avatar left, stat row right, overflow menu at the far
          end for the owner -- structural layout matches the familiar
          avatar/stats-row pattern, rendered in CookVerse's own tokens
          (mono numerals, copper hairlines) rather than borrowing anyone
          else's visual style. */}
      <div className="flex items-start gap-4">
        <div className="flex items-end gap-2">
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
          {isOwnProfile && gamification && (
            <XPRing
              level={gamification.level}
              xpIntoLevel={gamification.xp_into_level}
              xpForNextLevel={gamification.xp_for_next_level}
              size={36}
            />
          )}
        </div>

        <div className="flex flex-1 justify-around pt-2 font-mono">
          <div className="text-center">
            <p className="text-lg">{profile.recipe_count}</p>
            <p className="text-xs text-[#241E1A]/60 dark:text-flour/60">recipes</p>
          </div>
          <div className="text-center">
            <p className="text-lg">{profile.follower_count}</p>
            <p className="text-xs text-[#241E1A]/60 dark:text-flour/60">followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg">{profile.following_count}</p>
            <p className="text-xs text-[#241E1A]/60 dark:text-flour/60">following</p>
          </div>
        </div>

        {isOwnProfile && <ProfileMenu />}
      </div>

      <div className="mt-4">
        <h1 className="font-display text-2xl">{profile.full_name || `@${profile.username}`}</h1>
        <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">@{profile.username}</p>
        {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
      </div>

      <div className="mt-4 flex gap-2">
        {isOwnProfile ? (
          <>
            <Link
              href="/profile/edit"
              className="flex min-h-[44px] flex-1 items-center justify-center rounded-sm border border-copper/40 text-sm font-medium hover:bg-copper/10"
            >
              Edit profile
            </Link>
            <Link
              href="/saved"
              aria-label="Saved recipes"
              title="Saved recipes"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-copper/40 hover:bg-copper/10"
            >
              <Bookmark className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </Link>
            <Link
              href="/plan"
              aria-label="Meal plan"
              title="Meal plan"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-copper/40 hover:bg-copper/10"
            >
              <CalendarDays className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <FollowButton username={profile.username} initialFollowing={profile.is_following} />
        )}
      </div>

      <h2 className="mt-8 font-display text-xl">Recipes</h2>
      {!recipesData || recipesData.recipes.length === 0 ? (
        <p className="mt-2 text-sm text-[#241E1A]/60 dark:text-flour/60">
          {isOwnProfile ? "You haven't published a recipe yet." : 'Nothing published yet.'}
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
