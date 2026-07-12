'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SaveButtonProps {
  recipeId: string;
  initialSaved: boolean;
  variant?: ButtonProps['variant'];
  className?: string;
}

export function SaveButton({ recipeId, initialSaved, variant = 'secondary', className }: SaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  async function toggle() {
    setIsLoading(true);
    const next = !saved;

    try {
      await apiFetch(`/v1/recipes/${recipeId}/save`, { method: next ? 'POST' : 'DELETE' });
      setSaved(next);
    } catch {
      // no optimistic flip to revert here — state only changes on confirmed success
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant={variant} isLoading={isLoading} onClick={toggle} className={cn('gap-1.5', className)}>
      <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} strokeWidth={1.5} />
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
