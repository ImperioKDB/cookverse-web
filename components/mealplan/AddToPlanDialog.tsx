'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import type { MealPlanItem, MealType } from '@/lib/types';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface AddToPlanDialogProps {
  open: boolean;
  recipeId: string;
  /** The recipe's own base servings — the field's starting value, per the
      contract's default (omitting `servings` on POST falls back to this
      same number server-side, so this is just showing the person what
      they'd get either way, not a client-side guess). */
  recipeServings: number;
  onClose: () => void;
  onAdded: (item: MealPlanItem) => void;
}

/**
 * Same modal conventions as ConfirmDialog: 12px radius, soft shadow (the
 * one elevation token reserved for anything overlaying content), Escape to
 * close, focus the first real field on open. Kept as its own small
 * component rather than folded into ConfirmDialog since it collects real
 * input, not just a yes/no choice.
 */
export function AddToPlanDialog({ open, recipeId, recipeServings, onClose, onAdded }: AddToPlanDialogProps) {
  const [planDate, setPlanDate] = useState(todayIso());
  const [mealType, setMealType] = useState<MealType>('dinner');
  const [servings, setServings] = useState(recipeServings);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPlanDate(todayIso());
    setMealType('dinner');
    setServings(recipeServings);
    setError(null);
    dateInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, recipeServings, onClose]);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const item = await apiFetch<MealPlanItem>('/v1/meal-plan/items', {
        method: 'POST',
        body: JSON.stringify({ recipe_id: recipeId, plan_date: planDate, meal_type: mealType, servings }),
      });
      onAdded(item);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add to plan — try again');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-char/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-plan-title"
        className="w-full max-w-sm rounded-lg border border-copper/20 bg-flour p-5 shadow-lg dark:bg-char"
      >
        <h2 id="add-to-plan-title" className="font-display text-lg">
          Add to plan
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="plan-date" className="block text-sm font-medium">
              Day
            </label>
            <input
              ref={dateInputRef}
              id="plan-date"
              type="date"
              required
              value={planDate}
              onChange={(event) => setPlanDate(event.target.value)}
              className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
            />
          </div>

          <div>
            <span className="block text-sm font-medium">Meal</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {MEAL_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMealType(option.value)}
                  aria-pressed={mealType === option.value}
                  className={
                    mealType === option.value
                      ? 'min-h-[44px] rounded-sm border border-chili bg-chili px-3 text-sm font-medium text-flour'
                      : 'min-h-[44px] rounded-sm border border-copper/30 px-3 text-sm font-medium'
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="plan-servings" className="block text-sm font-medium">
              Servings
            </label>
            <input
              id="plan-servings"
              type="number"
              inputMode="numeric"
              min={1}
              required
              value={servings}
              onChange={(event) => setServings(Math.max(1, Number(event.target.value) || 1))}
              className="mt-1 w-24 rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base font-mono"
            />
          </div>

          <ErrorMessage>{error}</ErrorMessage>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-sm px-4 text-sm font-medium text-[#241E1A] hover:bg-copper/10 dark:text-flour"
            >
              Cancel
            </button>
            <Button type="submit" isLoading={isSaving}>
              Add
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
