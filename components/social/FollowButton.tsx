'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  username: string;
  initialFollowing: boolean;
}

export function FollowButton({ username, initialFollowing }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setIsLoading(true);
    setError(null);
    const next = !following;

    try {
      await apiFetch(`/v1/profiles/${username}/follow`, { method: next ? 'POST' : 'DELETE' });
      setFollowing(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update — try again');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Button variant={following ? 'secondary' : 'primary'} isLoading={isLoading} onClick={toggle}>
        {following ? 'Following' : 'Follow'}
      </Button>
      {error && (
        <p role="alert" className="mt-1 text-xs text-chili">
          {error}
        </p>
      )}
    </div>
  );
}
