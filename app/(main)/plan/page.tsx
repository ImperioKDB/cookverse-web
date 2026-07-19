'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { ErrorMessage } from '@/components/ui/error-message';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GroceryItem, MealPlanItem, MealType } from '@/lib/types';

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Calendar week, Sunday–Saturday, matching the backend spec's recommendation
    (a real date range, not a recurring template) and the design doc's
    literal "week grid with actual dates." */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MealPlanPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [items, setItems] = useState<MealPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGroceryList, setShowGroceryList] = useState(false);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = weekDays[6];

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ items: MealPlanItem[] }>(
        `/v1/meal-plan?start=${toIso(weekStart)}&end=${toIso(weekEnd)}`
      );
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your plan');
    } finally {
      setIsLoading(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateServings(item: MealPlanItem, nextServings: number) {
    const clamped = Math.max(1, nextServings);
    // Optimistic — same pattern as everywhere else in this app (Like/Follow/Save).
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, servings: clamped } : i)));
    try {
      await apiFetch(`/v1/meal-plan/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ servings: clamped }),
      });
    } catch {
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, servings: item.servings } : i)));
    }
  }

  async function removeItem(item: MealPlanItem) {
    const previous = items;
    setItems((current) => current.filter((i) => i.id !== item.id));
    try {
      await apiFetch(`/v1/meal-plan/items/${item.id}`, { method: 'DELETE' });
    } catch {
      setItems(previous);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Meal Plan</h1>
        <Button variant="secondary" size="sm" onClick={() => setShowGroceryList((v) => !v)}>
          {showGroceryList ? 'Back to plan' : 'Grocery list'}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setWeekStart((d) => addDays(d, -7))}
          aria-label="Previous week"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-copper/30"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
        <span className="font-mono text-sm text-[#241E1A]/70 dark:text-flour/70">
          {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
          {weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <button
          onClick={() => setWeekStart((d) => addDays(d, 7))}
          aria-label="Next week"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-copper/30"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>

      <ErrorMessage className="mt-4">{error}</ErrorMessage>

      {showGroceryList ? (
        <GroceryList start={toIso(weekStart)} end={toIso(weekEnd)} />
      ) : (
        <>
          {isLoading && <p className="mt-6 text-sm">Loading…</p>}

          {!isLoading && !error && (
            <div className="mt-6 space-y-6">
              {weekDays.map((day, index) => {
                const dayIso = toIso(day);
                const dayItems = items.filter((item) => item.plan_date === dayIso);
                return (
                  <section key={dayIso}>
                    <h2 className="font-mono text-sm text-[#241E1A]/60 dark:text-flour/60">
                      {DAY_LABELS[index]} · {day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </h2>
                    <div className="mt-2 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                      {MEAL_TYPES.map((meal) => {
                        const slot = dayItems.find((item) => item.meal_type === meal.value);
                        return (
                          <div
                            key={meal.value}
                            className="rounded-sm border border-copper/20 p-2"
                          >
                            <p className="text-xs font-medium text-[#241E1A]/60 dark:text-flour/60">{meal.label}</p>
                            {slot ? (
                              <MealSlot item={slot} onServingsChange={(n) => updateServings(slot, n)} onRemove={() => removeItem(slot)} />
                            ) : (
                              <p className="mt-2 text-xs text-[#241E1A]/40 dark:text-flour/40">Nothing planned</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              {!isLoading && items.length === 0 && (
                <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">
                  Nothing planned this week yet — use "Add to Plan" on any recipe to slot it in.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MealSlot({
  item,
  onServingsChange,
  onRemove,
}: {
  item: MealPlanItem;
  onServingsChange: (servings: number) => void;
  onRemove: () => void;
}) {
  if (!item.recipe) {
    // The underlying recipe was deleted/unpublished after being slotted —
    // per the backend spec, the slot stays rather than silently vanishing.
    return (
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-[#241E1A]/50 dark:text-flour/50">This recipe was removed</p>
        <button onClick={onRemove} aria-label="Remove from plan" className="text-chili">
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <Link href={`/recipes/${item.recipe.slug}`} className="flex items-center gap-2">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-copper/10">
          {item.recipe.cover_image_url && (
            <Image src={item.recipe.cover_image_url} alt={item.recipe.title} fill className="object-cover" />
          )}
        </div>
        <span className="line-clamp-2 text-xs">{item.recipe.title}</span>
      </Link>
      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => onServingsChange(item.servings - 1)}
            aria-label="Decrease servings"
            className="flex h-6 w-6 items-center justify-center rounded-sm border border-copper/30"
          >
            −
          </button>
          {item.servings}
          <button
            onClick={() => onServingsChange(item.servings + 1)}
            aria-label="Increase servings"
            className="flex h-6 w-6 items-center justify-center rounded-sm border border-copper/30"
          >
            +
          </button>
        </span>
        <button onClick={onRemove} aria-label="Remove from plan" className="text-chili">
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function GroceryList({ start, end }: { start: string; end: string }) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [unmerged, setUnmerged] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    apiFetch<{ items: GroceryItem[]; unmerged: GroceryItem[] }>(
      `/v1/meal-plan/grocery-list?start=${start}&end=${end}`
    )
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setUnmerged(data.unmerged);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your grocery list');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  function toggle(key: string) {
    setChecked((current) => {
      const next = new Set(current);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const allItems = [...items, ...unmerged];

  return (
    <div className="mt-6">
      <ErrorMessage>{error}</ErrorMessage>

      {isLoading && <p className="text-sm">Loading…</p>}

      {!isLoading && !error && allItems.length === 0 && (
        <p className="text-sm text-[#241E1A]/60 dark:text-flour/60">
          Nothing to shop for yet — plan a few meals this week first.
        </p>
      )}

      {/* Big checkboxes, mono quantities, high contrast — per the design
          doc, this list is meant to be legible one-handed in a bright
          supermarket, not a stylized card layout. Checked state is
          client-only (a shopping-trip checklist, not synced data). */}
      {allItems.length > 0 && (
        <ul className="space-y-1">
          {allItems.map((item, index) => {
            const key = `${item.name}-${item.unit ?? ''}-${index}`;
            const isChecked = checked.has(key);
            return (
              <li key={key}>
                <label className="flex min-h-[44px] items-center gap-3 rounded-sm border border-copper/15 px-3 py-2 text-base">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(key)}
                    className="h-6 w-6 shrink-0"
                  />
                  <span className={cn('flex-1', isChecked && 'line-through opacity-50')}>
                    <span className="font-mono">
                      {item.quantity ?? ''} {item.unit ?? ''}
                    </span>{' '}
                    {item.name}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {/* unmerged strictly means "no quantity to scale" per the current
          backend contract — a same-item-different-spelling duplicate (e.g.
          "onion" vs "yellow onion") is NOT flagged separately and will
          just appear as two normal line items above. Said plainly rather
          than pretending the list is fully deduplicated. */}
      {unmerged.length > 0 && (
        <p className="mt-4 text-xs text-[#241E1A]/50 dark:text-flour/50">
          Some items may need combining by hand — a few ingredients across your recipes couldn't be automatically
          merged.
        </p>
      )}
    </div>
  );
}
