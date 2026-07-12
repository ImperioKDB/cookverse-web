'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  likeableType: 'recipe' | 'video' | 'post' | 'comment';
  likeableId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ likeableType, likeableId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (isPending) return;

    // Optimistic update — reverted on failure rather than waiting on the
    // round-trip, since this is the highest-frequency interaction in the app.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));
    setIsPending(true);
    setError(null);

    try {
      await apiFetch('/v1/social/likes', {
        method: nextLiked ? 'POST' : 'DELETE',
        body: JSON.stringify({ likeable_type: likeableType, likeable_id: likeableId }),
      });
    } catch (err) {
      setLiked(!nextLiked);
      setCount((c) => c + (nextLiked ? -1 : 1));
      // Same pattern as FollowButton: a reverted optimistic update needs to
      // say why, not just silently snap back — a silent revert reads as a
      // glitch rather than a failure.
      setError(err instanceof Error ? err.message : 'Could not update — try again');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        onClick={toggle}
        aria-pressed={liked}
        className="flex min-h-[44px] items-center gap-1.5 rounded-sm px-2 text-sm"
      >
        <Heart
          className={cn('h-5 w-5', liked ? 'fill-chili text-chili' : 'text-[#241E1A]/70 dark:text-flour/70')}
          strokeWidth={1.5}
        />
        <span className="font-mono">{count}</span>
      </button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-chili">
          {error}
        </p>
      )}
    </div>
  );
}
