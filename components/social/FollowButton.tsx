'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';

interface FollowButtonProps {
  username: string;
  initialFollowing: boolean;
}

export function FollowButton({ username, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    // Optimistic: flip immediately, revert on failure — same pattern as
    // LikeButton, no spinner needed for something this fast to reverse.
    const next = !following;
    setFollowing(next);
    setError(null);

    try {
      await apiFetch(`/v1/profiles/${username}/follow`, { method: next ? 'POST' : 'DELETE' });
    } catch (err) {
      setFollowing(!next);
      setError(err instanceof Error ? err.message : 'Could not update — try again');
    }
  }

  return (
    <div>
      <Button variant={following ? 'secondary' : 'primary'} onClick={toggle}>
        {following ? 'Following' : 'Follow'}
      </Button>
      <ErrorMessage className="mt-1 text-xs">{error}</ErrorMessage>
    </div>
  );
}
