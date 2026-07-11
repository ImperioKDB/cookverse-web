import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function MyProfileRedirectPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
  const response = await fetch(`${apiUrl}/v1/profiles/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
    cache: 'no-store',
  });

  if (!response.ok) redirect('/feed'); // API unreachable — don't dead-end on a blank page
  const profile = await response.json();
  redirect(`/profile/${profile.username}`);
}
