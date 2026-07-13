import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const explicitNext = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // The bug this fixes: every Google sign-in (new account or returning
      // login — Supabase's OAuth flow doesn't distinguish them) used to
      // default straight to /onboarding with no way to tell the two apart.
      // Read the actual flag instead of assuming "no explicit destination
      // means new user."
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', data.user.id)
        .maybeSingle();

      const destination = explicitNext ?? (profile?.onboarding_completed ? '/feed' : '/onboarding');
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
