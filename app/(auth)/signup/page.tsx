'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSignup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is off, Supabase returns a session immediately;
    // otherwise the person needs to click the link we just emailed them.
    if (data.session) {
      router.push('/onboarding');
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="font-display text-2xl">Check your email</h1>
        <p className="text-sm text-[#241E1A]/70 dark:text-flour/70">
          We sent a confirmation link to {email}. Follow it to finish setting up your account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Join CookVerse</h1>
        <p className="mt-1 text-sm text-[#241E1A]/70 dark:text-flour/70">
          Learn to cook, not just watch someone else do it.
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-chili">
            {error}
          </p>
        )}

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-chili">
          Log in
        </Link>
      </p>
    </div>
  );
}
