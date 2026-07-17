'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, Camera, Trash2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { uploadRecipeMedia } from '@/lib/recipe-media-upload';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { DifficultyDial, DonenessDial } from '@/components/ui/doneness-dial';
import { cn } from '@/lib/utils';
import type { Difficulty, RecipeIngredient, RecipeNutrition, RecipeStep, Visibility } from '@/lib/types';

const DIFFICULTIES: { value: Difficulty; label: string; dialValue: number }[] = [
  { value: 'easy', label: 'Easy', dialValue: 1 },
  { value: 'medium', label: 'Medium', dialValue: 2 },
  { value: 'hard', label: 'Hard', dialValue: 3 },
  { value: 'expert', label: 'Expert', dialValue: 4 },
];

const inputClass = 'mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base';
const labelClass = 'block text-sm font-medium';

// --- Step 1: Basics ---------------------------------------------------------

interface Cuisine {
  id: string;
  name: string;
  slug: string;
}

interface BasicsDraft {
  title: string;
  description: string;
  cuisine_id: string | null;
  difficulty: Difficulty;
}

export function StepBasics({ draft, onChange }: { draft: BasicsDraft; onChange: (patch: Partial<BasicsDraft>) => void }) {
  const [cuisines, setCuisines] = useState<Cuisine[]>([]);

  useEffect(() => {
    apiFetch<{ cuisines: Cuisine[] }>('/v1/cuisines')
      .then((data) => setCuisines(data.cuisines))
      .catch(() => {
        /* cuisine picker just won't populate — the rest of the step still works */
      });
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          value={draft.title}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="Jollof rice with fried plantain"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          value={draft.description}
          onChange={(event) => onChange({ description: event.target.value })}
          rows={3}
          placeholder="A quick note about what makes this recipe worth cooking."
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="cuisine" className={labelClass}>
          Cuisine
        </label>
        <select
          id="cuisine"
          value={draft.cuisine_id ?? ''}
          onChange={(event) => onChange({ cuisine_id: event.target.value || null })}
          className={inputClass}
        >
          <option value="">Select a cuisine</option>
          {cuisines.map((cuisine) => (
            <option key={cuisine.id} value={cuisine.id}>
              {cuisine.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <span className={labelClass}>Difficulty</span>
        <div className="mt-2 flex items-center gap-4">
          <DonenessDial
            variant="difficulty"
            value={DIFFICULTIES.find((d) => d.value === draft.difficulty)?.dialValue ?? 1}
            max={4}
            size={48}
          />
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => onChange({ difficulty: d.value })}
                aria-pressed={draft.difficulty === d.value}
                className={cn(
                  'min-h-[44px] rounded-sm border px-3 text-sm',
                  draft.difficulty === d.value ? 'border-chili text-chili' : 'border-copper/30'
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Step 2: Ingredients -----------------------------------------------------

function emptyIngredient(): RecipeIngredient {
  return { name: '', quantity: null, unit: null, ingredient_group: null, notes: null, is_optional: false };
}

export function StepIngredients({
  ingredients,
  onChange,
}: {
  ingredients: RecipeIngredient[];
  onChange: (ingredients: RecipeIngredient[]) => void;
}) {
  const list = ingredients.length > 0 ? ingredients : [emptyIngredient()];

  function updateRow(index: number, patch: Partial<RecipeIngredient>) {
    onChange(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function addRow() {
    onChange([...list, emptyIngredient()]);
  }
  function removeRow(index: number) {
    onChange(list.length > 1 ? list.filter((_, i) => i !== index) : [emptyIngredient()]);
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {list.map((ingredient, index) => (
        <div key={index} className="rounded-sm border border-copper/20 p-3">
          <div className="grid grid-cols-[1fr_4.5rem_4.5rem] gap-2">
            <input
              value={ingredient.name}
              onChange={(event) => updateRow(index, { name: event.target.value })}
              placeholder="Ingredient name"
              className={inputClass}
            />
            <input
              type="number"
              inputMode="decimal"
              value={ingredient.quantity ?? ''}
              onChange={(event) =>
                updateRow(index, { quantity: event.target.value === '' ? null : Number(event.target.value) })
              }
              placeholder="Qty"
              className={cn(inputClass, 'font-mono')}
            />
            <input
              value={ingredient.unit ?? ''}
              onChange={(event) => updateRow(index, { unit: event.target.value || null })}
              placeholder="Unit"
              className={inputClass}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <input
              value={ingredient.ingredient_group ?? ''}
              onChange={(event) => updateRow(index, { ingredient_group: event.target.value || null })}
              placeholder='Group (optional) — e.g. "For the sauce"'
              className={cn(inputClass, 'mt-0 max-w-xs')}
            />
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move ingredient up"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === list.length - 1}
                aria-label="Move ingredient down"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Remove ingredient"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-chili"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={addRow}>
        Add ingredient
      </Button>
    </div>
  );
}

// --- Step 3: Steps (instructions) -------------------------------------------

function emptyStep(): RecipeStep {
  return { instruction: '', image_url: null, timer_seconds: null };
}

export function StepInstructions({
  recipeId,
  steps,
  onChange,
}: {
  recipeId: string;
  steps: RecipeStep[];
  onChange: (steps: RecipeStep[]) => void;
}) {
  const list = steps.length > 0 ? steps : [emptyStep()];
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  function updateRow(index: number, patch: Partial<RecipeStep>) {
    onChange(list.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function addRow() {
    onChange([...list, emptyStep()]);
  }
  function removeRow(index: number) {
    onChange(list.length > 1 ? list.filter((_, i) => i !== index) : [emptyStep()]);
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  async function handlePhotoChange(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingIndex(index);
    setUploadError(null);
    try {
      const url = await uploadRecipeMedia(recipeId, file);
      updateRow(index, { image_url: url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Could not upload photo — try again');
    } finally {
      setUploadingIndex(null);
    }
  }

  return (
    <div className="space-y-3">
      <ErrorMessage>{uploadError}</ErrorMessage>
      {list.map((step, index) => (
        <div key={index} className="rounded-sm border border-copper/20 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#241E1A]/60 dark:text-flour/60">Step {index + 1}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move step up"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === list.length - 1}
                aria-label="Move step down"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => removeRow(index)}
                aria-label="Remove step"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center text-chili"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>

          <textarea
            value={step.instruction}
            onChange={(event) => updateRow(index, { instruction: event.target.value })}
            rows={3}
            placeholder="What happens in this step?"
            className={inputClass}
          />

          <div className="mt-2 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              Timer (seconds)
              <input
                type="number"
                inputMode="numeric"
                value={step.timer_seconds ?? ''}
                onChange={(event) =>
                  updateRow(index, { timer_seconds: event.target.value === '' ? null : Number(event.target.value) })
                }
                className={cn(inputClass, 'mt-0 w-24 font-mono')}
              />
            </label>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={uploadingIndex === index}
              onClick={() => fileInputRefs.current[index]?.click()}
            >
              {step.image_url ? 'Replace photo' : 'Add photo'}
            </Button>
            <input
              ref={(element) => {
                fileInputRefs.current[index] = element;
              }}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => handlePhotoChange(index, event)}
            />
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={addRow}>
        Add step
      </Button>
    </div>
  );
}

// --- Step 4: Time & servings -------------------------------------------------

interface TimeServingsDraft {
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
}

export function StepTimeServings({
  draft,
  onChange,
}: {
  draft: TimeServingsDraft;
  onChange: (patch: Partial<TimeServingsDraft>) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <label htmlFor="prep-time" className={labelClass}>
          Prep time (minutes)
        </label>
        <input
          id="prep-time"
          type="number"
          inputMode="numeric"
          value={draft.prep_time_minutes ?? ''}
          onChange={(event) =>
            onChange({ prep_time_minutes: event.target.value === '' ? null : Number(event.target.value) })
          }
          className={cn(inputClass, 'font-mono')}
        />
      </div>
      <div>
        <label htmlFor="cook-time" className={labelClass}>
          Cook time (minutes)
        </label>
        <input
          id="cook-time"
          type="number"
          inputMode="numeric"
          value={draft.cook_time_minutes ?? ''}
          onChange={(event) =>
            onChange({ cook_time_minutes: event.target.value === '' ? null : Number(event.target.value) })
          }
          className={cn(inputClass, 'font-mono')}
        />
      </div>
      <div>
        <label htmlFor="servings" className={labelClass}>
          Servings
        </label>
        <input
          id="servings"
          type="number"
          inputMode="numeric"
          min={1}
          value={draft.servings}
          onChange={(event) => onChange({ servings: Math.max(1, Number(event.target.value) || 1) })}
          className={cn(inputClass, 'font-mono')}
        />
      </div>
    </div>
  );
}

// --- Step 5: Media (cover photo) ---------------------------------------------

export function StepMedia({
  recipeId,
  coverImageUrl,
  onChange,
}: {
  recipeId: string;
  coverImageUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const url = await uploadRecipeMedia(recipeId, file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo — try again');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <span className={labelClass}>Cover photo</span>
      <div className="mt-2 flex items-center gap-4">
        <div className="relative aspect-[4/5] w-32 shrink-0 overflow-hidden rounded-sm border border-copper/20 bg-copper/10">
          {coverImageUrl ? (
            <Image src={coverImageUrl} alt="Recipe cover" fill sizes="128px" className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-copper/50">
              <Camera className="h-6 w-6" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>
        <div>
          <Button type="button" variant="secondary" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
            {coverImageUrl ? 'Replace photo' : 'Upload photo'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
          <ErrorMessage className="mt-2 max-w-xs">{error}</ErrorMessage>
        </div>
      </div>
    </div>
  );
}

// --- Step 6: Nutrition (manual entry only — Phase 4 scope for auto-estimate) -

const NUTRITION_FIELDS: { key: keyof RecipeNutrition; label: string; unit: string }[] = [
  { key: 'calories', label: 'Calories', unit: 'kcal' },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g' },
  { key: 'fat_g', label: 'Fat', unit: 'g' },
  { key: 'fiber_g', label: 'Fiber', unit: 'g' },
  { key: 'sugar_g', label: 'Sugar', unit: 'g' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
];

export function StepNutrition({
  nutrition,
  onChange,
}: {
  nutrition: RecipeNutrition;
  onChange: (nutrition: RecipeNutrition) => void;
}) {
  return (
    <div>
      <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">
        Manual entry for now — per-serving values you estimate yourself, not calculated automatically. Leave
        anything unknown blank.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
        {NUTRITION_FIELDS.map(({ key, label, unit }) => (
          <div key={key}>
            <label htmlFor={key} className={labelClass}>
              {label} <span className="text-[#241E1A]/50 dark:text-flour/50">({unit})</span>
            </label>
            <input
              id={key}
              type="number"
              inputMode="decimal"
              value={nutrition[key] ?? ''}
              onChange={(event) =>
                onChange({ ...nutrition, [key]: event.target.value === '' ? null : Number(event.target.value) })
              }
              className={cn(inputClass, 'font-mono')}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Step 7: Visibility --------------------------------------------------

const VISIBILITY_OPTIONS: { value: Visibility; label: string; description: string }[] = [
  { value: 'public', label: 'Public', description: 'Anyone can find and view this recipe.' },
  { value: 'followers', label: 'Followers only', description: 'Only people who follow you can view it.' },
  {
    value: 'private',
    label: 'Private',
    description: "Only you can view it — useful while you're still testing a recipe.",
  },
];

export function StepVisibility({
  visibility,
  onChange,
}: {
  visibility: Visibility;
  onChange: (visibility: Visibility) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className={labelClass}>Who can see this recipe</legend>
      {VISIBILITY_OPTIONS.map((option) => (
        <label
          key={option.value}
          className={cn(
            'flex min-h-[44px] cursor-pointer items-start gap-3 rounded-sm border p-3',
            visibility === option.value ? 'border-chili' : 'border-copper/20'
          )}
        >
          <input
            type="radio"
            name="visibility"
            value={option.value}
            checked={visibility === option.value}
            onChange={() => onChange(option.value)}
            className="mt-1"
          />
          <span>
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="block text-xs text-[#241E1A]/60 dark:text-flour/60">{option.description}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

// --- Step 8: Preview -----------------------------------------------------

interface PreviewDraft {
  title: string;
  description: string;
  cover_image_url: string | null;
  difficulty: Difficulty;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition;
  visibility: Visibility;
}

/**
 * Mirrors app/(main)/recipes/[slug]/RecipeDetailClient.tsx's actual markup
 * and formatting for everything that page renders pre-publish: cover image
 * (aspect-[4/5]), title/difficulty/time row, and the ingredient list's exact
 * "{qty} {unit} name (optional)" mono formatting. RecipeDetailClient has no
 * exported sub-components to import directly — everything's inlined in one
 * function — so this still isn't literal component reuse, just markup
 * matched by hand against the real file. Two sections below are
 * editor-only additions with no live-page equivalent, called out inline
 * rather than left ambiguous:
 *   - "Steps" — the live page never lists steps outside Cook Mode, it only
 *     shows a "Start Cooking" CTA. Shown here anyway because reviewing what
 *     you wrote before publishing is the point of a preview step.
 *   - "Visibility" — not rendered anywhere on the live page (it's enforced
 *     access control, not displayed copy); shown here as a confirmation of
 *     what you picked in the previous step.
 */
export function StepPreview({ draft }: { draft: PreviewDraft }) {
  const totalTime = (draft.prep_time_minutes ?? 0) + (draft.cook_time_minutes ?? 0);
  const namedIngredients = draft.ingredients.filter((i) => i.name.trim());
  const namedSteps = draft.steps.filter((s) => s.instruction.trim());
  const hasNutrition = Object.values(draft.nutrition).some((v) => v !== null && v !== undefined);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:gap-8">
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-copper/10">
          {draft.cover_image_url ? (
            <Image src={draft.cover_image_url} alt={draft.title || 'Recipe cover'} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-copper/50">
              {(draft.title || 'Untitled').slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 lg:mt-0">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl leading-tight">{draft.title || 'Untitled recipe'}</h1>
          <DifficultyDial difficulty={draft.difficulty} size={48} />
        </div>

        {draft.description && <p className="mt-3 text-sm">{draft.description}</p>}

        <div className="mt-4 flex items-center gap-4 font-mono text-sm">
          <span>{totalTime > 0 ? `${totalTime} min` : 'Time not set'}</span>
          <span>Servings: {draft.servings}</span>
        </div>

        <h2 className="mt-8 font-display text-xl">Ingredients</h2>
        {namedIngredients.length === 0 ? (
          <p className="mt-2 text-sm text-[#241E1A]/60 dark:text-flour/60">No ingredients added yet.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {namedIngredients.map((ingredient, index) => (
              <li key={index}>
                <span className="font-mono">
                  {ingredient.quantity ?? ''} {ingredient.unit ?? ''}
                </span>{' '}
                {ingredient.name}
                {ingredient.is_optional && (
                  <span className="text-[#241E1A]/50 dark:text-flour/50"> (optional)</span>
                )}
              </li>
            ))}
          </ul>
        )}

        {hasNutrition && (
          <>
            <h2 className="mt-8 font-display text-xl">Nutrition (per serving)</h2>
            <p className="mt-2 font-mono text-sm">
              {draft.nutrition.calories ?? '—'} kcal · P {draft.nutrition.protein_g ?? '—'}g · C{' '}
              {draft.nutrition.carbs_g ?? '—'}g · F {draft.nutrition.fat_g ?? '—'}g
            </p>
          </>
        )}

        {/* Editor-only from here down — no equivalent on the live page. */}
        <h2 className="mt-8 font-display text-xl">Steps</h2>
        {namedSteps.length === 0 ? (
          <p className="mt-2 text-sm text-[#241E1A]/60 dark:text-flour/60">No steps added yet.</p>
        ) : (
          <ol className="mt-2 space-y-2 text-sm">
            {namedSteps.map((step, index) => (
              <li key={index}>
                <span className="font-mono text-xs text-copper">{index + 1}.</span> {step.instruction}
              </li>
            ))}
          </ol>
        )}

        <p className="mt-6 text-xs text-[#241E1A]/50 dark:text-flour/50">Visibility: {draft.visibility}</p>
      </div>
    </div>
  );
}
