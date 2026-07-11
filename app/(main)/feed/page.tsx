import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface MyProfile {
  username: string;
}

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  let profile: MyProfile | null = null;

  try {
    const response = await fetch(`${apiUrl}/v1/profiles/me`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      cache: 'no-store',
    });
    if (response.ok) {
      profile = await response.json();
    }
  } catch {
    // API may not be reachable yet in local dev if only one of the two
    // servers is running — degrade to the generic greeting below rather
    // than crashing the page.
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl">
        {profile ? `Good to see you, ${profile.username}.` : "You're in the kitchen."}
      </h1>
      <p className="mt-2 text-[#241E1A]/70 dark:text-flour/70">
        Your feed will fill up as you follow creators and save recipes. This is Phase 0 — the real
        feed lands in Phase 1.
      </p>
    </div>
  );
}
