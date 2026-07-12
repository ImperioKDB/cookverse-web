'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
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

export default function OnboardingPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<string[]>([]);
  const [cuisinesLoading, setCuisinesLoading] = useState(true);
  const [cuisinesError, setCuisinesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ cuisines: Cuisine[] }>('/v1/cuisines')
      .then((data) => setCuisines(data.cuisines))
      .catch((err) => setCuisinesError(err instanceof Error ? err.message : 'Could not load cuisines'))
      .finally(() => setCuisinesLoading(false));
  }, []);

  function toggleCuisine(id: string) {
    setSelectedCuisineIds((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarPreviewUrl(URL.createObjectURL(file)); // instant preview, don't wait on the upload
    setIsUploadingAvatar(true);
    setAvatarError(null);

    try {
      const { signedUrl, path } = await apiFetch<{ signedUrl: string; path: string }>(
        '/v1/profiles/me/avatar/upload-url',
        { method: 'POST', body: JSON.stringify({ filename: file.name }) }
      );

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .uploadToSignedUrl(path, new URL(signedUrl).searchParams.get('token') ?? '', file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatarUrl(publicUrlData.publicUrl);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Photo upload failed — you can add one later');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setIsLoading(true);

    try {
      await apiFetch('/v1/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName.trim() || undefined,
          skill_level: skillLevel,
          cuisine_ids: selectedCuisineIds,
          avatar_url: avatarUrl ?? undefined,
        }),
      });
      router.push('/feed');
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Let's set up your kitchen</h1>
        <p className="mt-1 text-sm text-[#241E1A]/70 dark:text-flour/70">
          This shapes what we show you first — you can change any of it anytime.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <label
            htmlFor="avatar"
            className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-copper/30 bg-copper/10"
          >
            {avatarPreviewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL, not worth Next/Image here
              <img src={avatarPreviewUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs text-[#241E1A]/50 dark:text-flour/50">Add photo</span>
            )}
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="sr-only"
            />
          </label>
          <div className="flex-1">
            <label htmlFor="fullName" className="block text-sm font-medium">
              Your name
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="What should we call you?"
              className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
            />
            {isUploadingAvatar && <p className="mt-1 text-xs">Uploading photo…</p>}
            {avatarError && <p className="mt-1 text-xs text-chili">{avatarError}</p>}
          </div>
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
                  skillLevel === level.value
                    ? 'border-chili bg-chili text-flour'
                    : 'border-copper/30'
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Favorite cuisines (optional)</legend>
          {cuisinesError && (
            <p role="alert" className="mt-2 text-sm text-chili">
              {cuisinesError}
            </p>
          )}
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

        {submitError && (
          <p role="alert" className="text-sm text-chili">
            {submitError}
          </p>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Continue
        </Button>
      </form>
    </div>
  );
}
