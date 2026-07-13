'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ChipRowSkeleton } from '@/components/ui/skeleton';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
import { LoadingDial } from '@/components/ui/loading-dial';
import { ErrorMessage } from '@/components/ui/error-message';
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<string[]>([]);
  const [cuisinesLoading, setCuisinesLoading] = useState(true);
  const [cuisinesError, setCuisinesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          onboarding_completed: true,
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
          {/* AvatarUpload already handles its own upload flow, preview, and
              error state end to end — onboarding just needs the resulting
              URL for the final submit below. */}
          <AvatarUpload
            initialAvatarUrl={null}
            displayName={fullName || 'You'}
            onUploaded={setAvatarUrl}
            size="lg"
          />
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
          <ErrorMessage className="mt-2">{cuisinesError}</ErrorMessage>
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

        <Button
          type="submit"
          isLoading={isLoading}
          loadingContent={<LoadingDial size={18} />}
          className="w-full"
        >
          Continue
        </Button>
      </form>
    </div>
  );
}
