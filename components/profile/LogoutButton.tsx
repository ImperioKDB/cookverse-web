'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-sm font-medium text-[#241E1A]/60 underline-offset-2 hover:underline disabled:opacity-60 dark:text-flour/60"
    >
      {isLoggingOut ? 'Logging out…' : 'Log out'}
    </button>
  );
}
