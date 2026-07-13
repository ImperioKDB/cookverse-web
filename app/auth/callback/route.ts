import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const explicitNext = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let destination = explicitNext;

      if (!destination) {
        // No caller-specified destination. Google OAuth is the sign-in path
        // for both brand-new signups and returning logins — there's no way
        // to tell which this is from the callback alone — so the old
        // hardcoded '/onboarding' default sent every returning user back
        // through onboarding on every single login. Decide from whether
        // they've actually completed it (full_name gets set there and
        // nowhere else) instead of assuming "new."
        const {
          data: { user },
        } = await supabase.auth.getUser();

        const profile = user
          ? await supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
          : null;

        destination = profile?.data?.full_name ? '/feed' : '/onboarding';
      }

      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
