'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ErrorMessage } from '@/components/ui/error-message';

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setIsLoading(false);
      return;
    }

    router.push('/login');
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="min-h-[44px] text-sm font-medium text-chili disabled:opacity-40"
      >
        {isLoading ? 'Logging out…' : 'Log out'}
      </button>
      <ErrorMessage className="mt-1 text-xs">{error}</ErrorMessage>
    </div>
  );
}
