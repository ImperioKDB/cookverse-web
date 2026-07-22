import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function MyProfileRedirectPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  // profiles is public-read under RLS -- no need to round-trip through the
  // Render API (which may be asleep, see gotcha #3) just for a username.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.user.id)
    .maybeSingle();

  if (error || !profile) redirect('/feed'); // API/DB unreachable -- don't dead-end
  redirect(`/profile/${profile.username}`);
}
