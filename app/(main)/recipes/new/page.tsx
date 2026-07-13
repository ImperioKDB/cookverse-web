'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { DifficultyDial } from '@/components/ui/doneness-dial';
import { ErrorMessage } from '@/components/ui/error-message';
import { cn } from '@/lib/utils';
import type { Difficulty, RecipeIngredient, RecipeStep } from '@/lib/types';

const STEPS = ['Basics', 'Ingredients', 'Steps', 'Time & Nutrition', 'Preview'] as const;
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

export default function NewRecipePage() {
  const router = useRouter();
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createdRef = useRef(false);

  // Basics
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Ingredients / Steps
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([{ name: '' }]);
  const [steps, setSteps] = useState<RecipeStep[]>([{ instruction: '' }]);

  // Time & nutrition
  const [prepTime, setPrepTime] = useState<number | ''>('');
  const [cookTime, setCookTime] = useState<number | ''>('');
  const [servings, setServings] = useState(4);
  const [calories, setCalories] = useState<number | ''>('');

  // Create the draft the moment someone lands on this page — every step
  // after this just PATCHes it. See 06-design-system.md, "Forms & feedback".
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    apiFetch<{ id: string; slug: string }>('/v1/recipes', { method: 'POST', body: JSON.stringify({}) })
      .then((data) => {
        setRecipeId(data.id);
        setSlug(data.slug);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not start a new recipe'));
  }, []);

  async function saveStep(fields: Record<string, unknown>) {
    if (!recipeId) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch(`/v1/recipes/${recipeId}`, { method: 'PATCH', body: JSON.stringify(fields) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save — try again');
      throw err;
    } finally {
      setIsSaving(false);
    }
  }

  async function handleNext() {
    try {
      if (stepIndex === 0) {
        await saveStep({ title, description, difficulty });
      } else if (stepIndex === 1) {
        await saveStep({ ingredients: ingredients.filter((i) => i.name.trim()) });
      } else if (stepIndex === 2) {
        await saveStep({ steps: steps.filter((s) => s.instruction.trim()) });
      } else if (stepIndex === 3) {
        await saveStep({
          prep_time_minutes: prepTime === '' ? null : prepTime,
          cook_time_minutes: cookTime === '' ? null : cookTime,
          servings,
          nutrition: calories === '' ? null : { calories },
        });
      }
      setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
    } catch {
      // error state already set by saveStep — stay on this step
    }
  }

  async function handleCoverUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !recipeId) return;

    setIsUploadingCover(true);
    setError(null);
    try {
      const { signedUrl, path } = await apiFetch<{ signedUrl: string; path: string }>(
        `/v1/recipes/${recipeId}/media/upload-url`,
        { method: 'POST', body: JSON.stringify({ filename: file.name }) }
      );

      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('recipe-media')
        .uploadToSignedUrl(path, new URL(signedUrl).searchParams.get('token') ?? '', file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('recipe-media').getPublicUrl(path);
      setCoverImageUrl(publicUrlData.publicUrl);
      await saveStep({ cover_image_url: publicUrlData.publicUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cover photo upload failed');
    } finally {
      setIsUploadingCover(false);
    }
  }

  async function handlePublish() {
    if (!recipeId) return;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch(`/v1/recipes/${recipeId}/publish`, { method: 'POST' });
      router.push(`/recipes/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish yet');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-28">
      <p className="font-mono text-sm text-[#241E1A]/60 dark:text-flour/60">
        Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex]}
      </p>
      <div className="mt-2 h-1 w-full rounded-full bg-copper/15">
        <div
          className="h-1 rounded-full bg-chili transition-all"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <ErrorMessage className="mt-4">{error}</ErrorMessage>

      {stepIndex === 0 && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Cover photo</label>
            <input type="file" accept="image/*" onChange={handleCoverUpload} className="mt-1 text-sm" />
            {isUploadingCover && <p className="mt-1 text-xs">Uploading…</p>}
            {coverImageUrl && <p className="mt-1 text-xs text-bay">Cover photo set.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Difficulty</label>
            <div className="mt-2 flex items-center gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-sm border p-2',
                    difficulty === d ? 'border-chili' : 'border-copper/30'
                  )}
                >
                  <DifficultyDial difficulty={d} size={40} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {stepIndex === 1 && (
        <div className="mt-6 space-y-3">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex gap-2">
              <input
                placeholder="Quantity"
                type="number"
                value={ingredient.quantity ?? ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? null : Number(e.target.value);
                  setIngredients((current) =>
                    current.map((ing, i) => (i === index ? { ...ing, quantity: value } : ing))
                  );
                }}
                className="w-20 rounded-sm border border-copper/30 bg-transparent px-2 py-2 text-base"
              />
              <input
                placeholder="Unit"
                value={ingredient.unit ?? ''}
                onChange={(e) =>
                  setIngredients((current) =>
                    current.map((ing, i) => (i === index ? { ...ing, unit: e.target.value } : ing))
                  )
                }
                className="w-20 rounded-sm border border-copper/30 bg-transparent px-2 py-2 text-base"
              />
              <input
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(e) =>
                  setIngredients((current) =>
                    current.map((ing, i) => (i === index ? { ...ing, name: e.target.value } : ing))
                  )
                }
                className="flex-1 rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
              />
              <button
                onClick={() => setIngredients((current) => current.filter((_, i) => i !== index))}
                className="text-chili"
                aria-label="Remove ingredient"
              >
                ✕
              </button>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIngredients((current) => [...current, { name: '' }])}
          >
            + Add ingredient
          </Button>
        </div>
      )}

      {stepIndex === 2 && (
        <div className="mt-6 space-y-3">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <span className="mt-2 font-mono text-sm">{index + 1}.</span>
              <textarea
                value={step.instruction}
                onChange={(e) =>
                  setSteps((current) =>
                    current.map((s, i) => (i === index ? { ...s, instruction: e.target.value } : s))
                  )
                }
                rows={2}
                className="flex-1 rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
              />
              <button
                onClick={() => setSteps((current) => current.filter((_, i) => i !== index))}
                className="text-chili"
                aria-label="Remove step"
              >
                ✕
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setSteps((current) => [...current, { instruction: '' }])}>
            + Add step
          </Button>
        </div>
      )}

      {stepIndex === 3 && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Prep time (min)</label>
              <input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Cook time (min)</label>
              <input
                type="number"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value === '' ? '' : Number(e.target.value))}
                className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Servings</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="mt-1 w-24 rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Calories per serving (optional)</label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1 w-32 rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
            />
          </div>
        </div>
      )}

      {stepIndex === 4 && (
        <div className="mt-6 space-y-2">
          <h2 className="font-display text-2xl">{title || 'Untitled recipe'}</h2>
          <DifficultyDial difficulty={difficulty} size={40} />
          <p className="text-sm">{description}</p>
          <p className="font-mono text-sm">
            {ingredients.filter((i) => i.name.trim()).length} ingredients ·{' '}
            {steps.filter((s) => s.instruction.trim()).length} steps
          </p>
          <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">
            Ready to publish? This makes the recipe public.
          </p>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-copper/20 bg-flour p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:bg-char">
        <Button
          variant="secondary"
          className="flex-1"
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
        >
          Back
        </Button>
        {stepIndex < STEPS.length - 1 ? (
          <Button className="flex-1" isLoading={isSaving} onClick={handleNext}>
            Save & continue
          </Button>
        ) : (
          <Button className="flex-1" isLoading={isSaving} onClick={handlePublish}>
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}
