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

  async function toggle() {
    // Optimistic, reverted on failure — consistent with Like/Follow now.
    const next = !saved;
    setSaved(next);

    try {
      await apiFetch(`/v1/recipes/${recipeId}/save`, { method: next ? 'POST' : 'DELETE' });
    } catch {
      setSaved(!next);
    }
  }

  return (
    <Button variant={variant} onClick={toggle} className={cn('gap-1.5', className)}>
      <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} strokeWidth={1.5} />
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
