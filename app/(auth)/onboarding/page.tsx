'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ChipsSkeleton } from '@/components/ui/skeleton';
import { AvatarUpload } from '@/components/profile/AvatarUpload';
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
  const [nameError, setNameError] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('beginner');
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);
  const [isLoadingCuisines, setIsLoadingCuisines] = useState(true);
  const [selectedCuisineIds, setSelectedCuisineIds] = useState<string[]>([]);
  const [cuisinesError, setCuisinesError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    apiFetch<{ cuisines: Cuisine[] }>('/v1/cuisines')
      .then((data) => setCuisines(data.cuisines))
      .catch((err) => setCuisinesError(err instanceof Error ? err.message : 'Could not load cuisines'))
      .finally(() => setIsLoadingCuisines(false));
  }, []);

  function toggleCuisine(id: string) {
    setSelectedCuisineIds((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    setNameError(null);

    if (!fullName.trim()) {
      setNameError('Tell us what to call you');
      return;
    }

    setIsLoading(true);

    try {
      await apiFetch('/v1/profiles/me', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName.trim(),
          skill_level: skillLevel,
          cuisine_ids: selectedCuisineIds,
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
        <h1 className="font-display text-3xl">How do you cook?</h1>
        <p className="mt-1 text-sm text-[#241E1A]/70 dark:text-flour/70">
          This shapes what we show you first — you can change it anytime.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="full-name" className="text-sm font-medium">
            What should we call you?
          </label>
          <input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            autoFocus
            className="mt-2 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
          />
          {nameError && (
            <p role="alert" className="mt-1 text-sm text-chili">
              {nameError}
            </p>
          )}
          <p className="mt-1 text-xs text-[#241E1A]/60 dark:text-flour/60">
            Shown on your profile instead of @username.
          </p>
        </div>

        <div>
          <span className="text-sm font-medium">Profile photo (optional)</span>
          <div className="mt-2">
            <AvatarUpload initialAvatarUrl={null} displayName={fullName || 'You'} size="md" />
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
          {isLoadingCuisines ? (
            <div className="mt-2">
              <ChipsSkeleton />
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
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
