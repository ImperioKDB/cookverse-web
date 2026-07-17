'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Toast, useToast } from '@/components/ui/toast';
import { EditorStepIndicator } from '@/components/recipe/editor/EditorStepIndicator';
import {
  StepBasics,
  StepIngredients,
  StepInstructions,
  StepMedia,
  StepNutrition,
  StepPreview,
  StepTimeServings,
  StepVisibility,
} from '@/components/recipe/editor/steps';
import type { Difficulty, RecipeIngredient, RecipeNutrition, RecipeStep, Visibility } from '@/lib/types';

const STEP_LABELS = [
  'Basics',
  'Ingredients',
  'Steps',
  'Time & servings',
  'Media',
  'Nutrition',
  'Visibility',
  'Preview',
  'Publish',
] as const;

const LAST_STEP = STEP_LABELS.length - 1;
const PREVIEW_STEP = STEP_LABELS.length - 2;

interface DraftState {
  id: string | null;
  slug: string | null;
  title: string;
  description: string;
  cuisine_id: string | null;
  difficulty: Difficulty;
  cover_image_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: RecipeNutrition;
  visibility: Visibility;
}

const EMPTY_DRAFT: DraftState = {
  id: null,
  slug: null,
  title: '',
  description: '',
  cuisine_id: null,
  difficulty: 'easy',
  cover_image_url: null,
  prep_time_minutes: null,
  cook_time_minutes: null,
  servings: 4,
  ingredients: [],
  steps: [],
  nutrition: {},
  visibility: 'public',
};

// Each step PATCHes only the fields it owns — matches the one-flexible-PATCH
// pattern in recipes.schema.ts's updateRecipeSchema, same convention every
// other multi-step form in this app already follows (onboarding, etc.).
function fieldsForStep(stepIndex: number, draft: DraftState): Record<string, unknown> {
  switch (stepIndex) {
    case 0: // Basics
      return {
        title: draft.title.trim() || 'Untitled recipe',
        description: draft.description || null,
        cuisine_id: draft.cuisine_id,
        difficulty: draft.difficulty,
      };
    case 1: // Ingredients
      return { ingredients: draft.ingredients.filter((i) => i.name.trim()) };
    case 2: // Steps
      return { steps: draft.steps.filter((s) => s.instruction.trim()) };
    case 3: // Time & servings
      return {
        prep_time_minutes: draft.prep_time_minutes,
        cook_time_minutes: draft.cook_time_minutes,
        servings: draft.servings,
      };
    case 4: // Media
      return { cover_image_url: draft.cover_image_url };
    case 5: { // Nutrition
      const hasAnyValue = Object.values(draft.nutrition).some((v) => v !== null && v !== undefined);
      return { nutrition: hasAnyValue ? draft.nutrition : null };
    }
    case 6: // Visibility
      return { visibility: draft.visibility };
    default:
      return {};
  }
}

export default function NewRecipePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [stepIndex, setStepIndex] = useState(0);
  const [isCreatingDraft, setIsCreatingDraft] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isDirtyRef = useRef(false);
  const { toast, showToast, dismissToast } = useToast();

  // Create the draft row immediately on mount — per 06-design-system.md's
  // autosave rule, nothing here waits on an explicit "Save Draft" tap.
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ id: string; slug: string; status: string }>('/v1/recipes', {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then((data) => {
        if (cancelled) return;
        setDraft((d) => ({ ...d, id: data.id, slug: data.slug }));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not start a new recipe');
      })
      .finally(() => {
        if (!cancelled) setIsCreatingDraft(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateDraft(patch: Partial<DraftState>) {
    isDirtyRef.current = true;
    setDraft((d) => ({ ...d, ...patch }));
  }

  const saveCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!draft.id) return false;
    setIsSaving(true);
    setError(null);
    try {
      await apiFetch(`/v1/recipes/${draft.id}`, {
        method: 'PATCH',
        body: JSON.stringify(fieldsForStep(stepIndex, draft)),
      });
      isDirtyRef.current = false;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this step — try again');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [draft, stepIndex]);

  async function goNext() {
    const ok = await saveCurrentStep();
    if (!ok) return;
    setStepIndex((i) => Math.min(i + 1, LAST_STEP));
  }

  function goBack() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }

  function handleExitClick() {
    if (isDirtyRef.current) {
      setShowExitConfirm(true);
    } else {
      router.push('/feed');
    }
  }

  async function handlePublish() {
    if (!draft.id) return;

    const ok = await saveCurrentStep();
    if (!ok) return;

    setIsPublishing(true);
    setError(null);
    try {
      const published = await apiFetch<{ slug: string }>(`/v1/recipes/${draft.id}/publish`, { method: 'POST' });
      showToast('Published');
      router.push(`/recipes/${published.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish — check the earlier steps for what's missing");
    } finally {
      setIsPublishing(false);
    }
  }

  if (isCreatingDraft) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-[#241E1A]/60 dark:text-flour/60">
        Setting up your new recipe…
      </div>
    );
  }

  if (!draft.id) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <ErrorMessage>{error ?? 'Could not start a new recipe'}</ErrorMessage>
      </div>
    );
  }

  const isLastStep = stepIndex === LAST_STEP;
  const isPreviewStep = stepIndex === PREVIEW_STEP;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <div className="flex items-center justify-between gap-3">
        <EditorStepIndicator current={stepIndex} total={STEP_LABELS.length} label={STEP_LABELS[stepIndex]} />
        {/* Persistent exit affordance, separate from the wizard's own step-back
            button below — per 06-design-system.md, disabling step-back on
            step 1 is not the same thing as a way out of the flow entirely. */}
        <button type="button" onClick={handleExitClick} className="min-h-[44px] shrink-0 px-2 text-sm font-medium text-chili">
          ← Exit
        </button>
      </div>

      <ErrorMessage className="mt-4">{error}</ErrorMessage>

      <div className="mt-6">
        {stepIndex === 0 && <StepBasics draft={draft} onChange={updateDraft} />}
        {stepIndex === 1 && (
          <StepIngredients ingredients={draft.ingredients} onChange={(ingredients) => updateDraft({ ingredients })} />
        )}
        {stepIndex === 2 && (
          <StepInstructions recipeId={draft.id} steps={draft.steps} onChange={(steps) => updateDraft({ steps })} />
        )}
        {stepIndex === 3 && <StepTimeServings draft={draft} onChange={updateDraft} />}
        {stepIndex === 4 && (
          <StepMedia
            recipeId={draft.id}
            coverImageUrl={draft.cover_image_url}
            onChange={(cover_image_url) => updateDraft({ cover_image_url })}
          />
        )}
        {stepIndex === 5 && (
          <StepNutrition nutrition={draft.nutrition} onChange={(nutrition) => updateDraft({ nutrition })} />
        )}
        {stepIndex === 6 && (
          <StepVisibility visibility={draft.visibility} onChange={(visibility) => updateDraft({ visibility })} />
        )}
        {isPreviewStep && <StepPreview draft={draft} />}
        {isLastStep && (
          <div className="py-8 text-center">
            <h2 className="font-display text-2xl">Ready to publish?</h2>
            <p className="mt-2 text-sm text-[#241E1A]/60 dark:text-flour/60">
              Your recipe stays saved as a draft either way — publish now, or come back to it later from your
              profile.
            </p>
          </div>
        )}
      </div>

      {/* lg:left-56 clears the sidebar, matching MainLayout's lg:ml-56 for
          the content column — same pattern the mobile bottom nav uses. */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-copper/20 bg-flour p-4 dark:bg-char lg:left-56">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {stepIndex > 0 && (
            <Button variant="secondary" onClick={goBack} disabled={isSaving || isPublishing}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {!isLastStep ? (
            <Button onClick={goNext} isLoading={isSaving}>
              Save &amp; continue
            </Button>
          ) : (
            <Button onClick={handlePublish} isLoading={isPublishing}>
              Publish
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showExitConfirm}
        title="Discard unsaved changes?"
        body="You have changes on this step that haven't been saved yet. Everything from earlier steps is already safe."
        confirmLabel="Discard & exit"
        cancelLabel="Keep editing"
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push('/feed');
        }}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
