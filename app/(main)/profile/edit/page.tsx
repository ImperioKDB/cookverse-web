'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { ErrorMessage } from '@/components/ui/error-message';
import { ChipRowSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'home_cook', label: 'Home Cook' },
  { value: 'skilled', label: 'Skilled' },
  { value: 'professional', label: 'Professional' },
] as const;

type SkillLevel = (typeof SKILL_LEVELS)[number]['value'];

interface Cuisine {
  id: string;
  name: string;
  slug: string;
  region: string | null;
}

interface MyProfile {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  skill_level: SkillLevel;
  profile_cuisines: { cuisines: { id: string; name: string; slug: string } }[];
}

/**
 * The gap this closes: onboarding writes full_name/bio/skill_level/cuisines
 * once, and until now there was no screen to change any of it afterward --
 * AvatarUpload let you swap the photo, nothing else. Same one-flexible-PATCH
 * pattern as onboarding and the recipe editor: sends the full current state
 * of every field it owns, not a diff.
 */
export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<string[]>([]);
  const [cuisinesLoading, setCuisinesLoading] = useState(true);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiFetch<MyProfile>('/v1/profiles/me')
      .then((data) => {
        setProfile(data);
        setFullName(data.full_name ?? '');
        setBio(data.bio ?? '');
        setAvatarUrl(data.avatar_url);
        setSkillLevel(data.skill_level);
        setSelectedCuisineIds(data.profile_cuisines.map((pc) => pc.cuisines.id));
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load your profile'))
      .finally(() => setIsLoadingProfile(false));

    apiFetch<{ cuisines: Cuisine[] }>('/v1/cuisines')
      .then((data) => setCuisines(data.cuisines))
      .catch(() => {
        /* cuisine picker just won't populate -- the rest of the form still works */
      })
      .finally(() => setCuisinesLoading(false));
  }, []);

  function toggleCuisine(id: string) {
    setSelectedCuisineIds((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;

    setSubmitError(null);
    setIsSaving(true);

    try {
      await apiFetch('/v1/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName.trim() || undefined,
          bio: bio.trim() || undefined,
          skill_level: skillLevel,
          cuisine_ids: selectedCuisineIds,
          avatar_url: avatarUrl ?? undefined,
        }),
      });
      router.push(`/profile/${profile.username}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not save -- try again');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-[#241E1A]/60 dark:text-flour/60">
        Loading your profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <ErrorMessage>{loadError ?? 'Could not load your profile'}</ErrorMessage>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Edit profile</h1>
        <Link href={`/profile/${profile.username}`} className="text-sm font-medium text-chili">
          Cancel
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div className="flex items-center gap-4">
          <AvatarUpload
            initialAvatarUrl={profile.avatar_url}
            displayName={fullName || profile.username}
            onUploaded={setAvatarUrl}
          />
          <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">Tap the photo to change it.</p>
        </div>

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="A line or two about what you cook."
            className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
          />
          <p className="mt-1 text-right font-mono text-xs text-[#241E1A]/50 dark:text-flour/50">
            {bio.length}/500
          </p>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Skill level</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SKILL_LEVELS.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setSkillLevel(level.value)}
                aria-pressed={skillLevel === level.value}
                className={cn(
                  'min-h-[44px] rounded-sm border px-3 py-2 text-sm font-medium',
                  skillLevel === level.value ? 'border-chili bg-chili text-flour' : 'border-copper/30'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Favorite cuisines</legend>
          <div className="mt-2">
            {cuisinesLoading ? (
              <ChipRowSkeleton />
            ) : (
              <div className="flex flex-wrap gap-2">
                {cuisines.map((cuisine) => {
                  const selected = selectedCuisineIds.includes(cuisine.id);
                  return (
                    <button
                      key={cuisine.id}
                      type="button"
                      onClick={() => toggleCuisine(cuisine.id)}
                      aria-pressed={selected}
                      className={cn(
                        'min-h-[44px] rounded-sm border px-3 py-2 text-sm font-medium',
                        selected ? 'border-chili bg-chili text-flour' : 'border-copper/30'
                      )}
                    >
                      {cuisine.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </fieldset>

        <ErrorMessage>{submitError}</ErrorMessage>

        <Button type="submit" isLoading={isSaving} className="w-full">
          Save changes
        </Button>
      </form>
    </div>
  );
}
