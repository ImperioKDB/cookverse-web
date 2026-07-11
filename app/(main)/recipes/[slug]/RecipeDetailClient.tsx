'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { DifficultyDial, DonenessDial } from '@/components/ui/doneness-dial';
import { Button } from '@/components/ui/button';
import type { RecipeDetail } from '@/lib/types';

export function RecipeDetailClient({ recipe }: { recipe: RecipeDetail }) {
  const [servings, setServings] = useState(recipe.servings);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [cookMode, setCookMode] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const scale = servings / recipe.servings;

  const toggleChecked = (id: string) => {
    setChecked((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (cookMode) {
    const step = recipe.recipe_steps[stepIndex];
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-between px-4 py-8">
        <div>
          <button onClick={() => setCookMode(false)} className="text-sm text-chili">
            ← Exit cook mode
          </button>
          <p className="mt-6 font-mono text-sm text-[#241E1A]/60 dark:text-flour/60">
            Step {stepIndex + 1} of {recipe.recipe_steps.length}
          </p>
          <p className="mt-2 text-2xl leading-snug">{step.instruction}</p>
          {step.timer_seconds && (
            <div className="mt-6">
              <DonenessDial
                variant="timer"
                value={step.timer_seconds}
                max={step.timer_seconds}
                label={`${Math.round(step.timer_seconds / 60)} min`}
                size={96}
              />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            disabled={stepIndex === recipe.recipe_steps.length - 1}
            onClick={() => setStepIndex((i) => Math.min(recipe.recipe_steps.length - 1, i + 1))}
          >
            Next step
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-28 pt-6 lg:grid lg:grid-cols-2 lg:gap-8 lg:pb-8">
      <div>
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-copper/10">
          {recipe.cover_image_url ? (
            <Image src={recipe.cover_image_url} alt={recipe.title} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-4xl text-copper/50">
              {recipe.title.slice(0, 1)}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 lg:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl leading-tight">{recipe.title}</h1>
            {recipe.author && (
              <p className="mt-1 text-sm text-[#241E1A]/60 dark:text-flour/60">
                @{recipe.author.username}
              </p>
            )}
          </div>
          <DifficultyDial difficulty={recipe.difficulty} size={48} />
        </div>

        {recipe.description && <p className="mt-3 text-sm">{recipe.description}</p>}

        <div className="mt-4 flex items-center gap-4 font-mono text-sm">
          <span>{recipe.total_time_minutes} min</span>
          <span className="flex items-center gap-2">
            Servings:
            <button
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="h-8 w-8 rounded-sm border border-copper/30"
              aria-label="Decrease servings"
            >
              −
            </button>
            {servings}
            <button
              onClick={() => setServings((s) => s + 1)}
              className="h-8 w-8 rounded-sm border border-copper/30"
              aria-label="Increase servings"
            >
              +
            </button>
          </span>
        </div>

        <h2 className="mt-8 font-display text-xl">Ingredients</h2>
        <ul className="mt-2 space-y-2">
          {recipe.recipe_ingredients.map((ingredient) => {
            const id = ingredient.id ?? ingredient.name;
            const scaledQty = ingredient.quantity ? (ingredient.quantity * scale).toFixed(2) : null;
            return (
              <li key={id}>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={checked.has(id)}
                    onChange={() => toggleChecked(id)}
                    className="mt-1 h-5 w-5"
                  />
                  <span className={checked.has(id) ? 'line-through opacity-50' : ''}>
                    <span className="font-mono">
                      {scaledQty} {ingredient.unit}
                    </span>{' '}
                    {ingredient.name}
                    {ingredient.is_optional && (
                      <span className="text-[#241E1A]/50 dark:text-flour/50"> (optional)</span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {recipe.recipe_nutrition && (
          <>
            <h2 className="mt-8 font-display text-xl">Nutrition (per serving)</h2>
            <p className="mt-2 font-mono text-sm">
              {recipe.recipe_nutrition.calories ?? '—'} kcal · P {recipe.recipe_nutrition.protein_g ?? '—'}g ·
              C {recipe.recipe_nutrition.carbs_g ?? '—'}g · F {recipe.recipe_nutrition.fat_g ?? '—'}g
            </p>
          </>
        )}
      </div>

      {/* Sticky action bar: one primary action, two secondary — per the design
          audit fix in 11-design-audit.md. */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-copper/20 bg-flour p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] dark:bg-char lg:static lg:col-span-2 lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:pb-0">
        {/* Collections and meal planning are the next slice, not this one —
            disabled rather than a silently-broken-looking live button. */}
        <Button variant="secondary" className="flex-1" disabled title="Coming soon">
          Save
        </Button>
        <Button variant="secondary" className="flex-1" disabled title="Coming soon">
          Add to Plan
        </Button>
        <Button
          className="flex-[2]"
          onClick={() => {
            setStepIndex(0);
            setCookMode(true);
          }}
          disabled={recipe.recipe_steps.length === 0}
        >
          Start Cooking
        </Button>
      </div>
    </div>
  );
}
