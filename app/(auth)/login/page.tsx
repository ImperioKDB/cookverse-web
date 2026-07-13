'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailLogin(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setIsLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/feed');
    router.refresh();
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="mt-1 text-sm text-[#241E1A]/70 dark:text-flour/70">
          Log in to keep cooking.
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-sm border border-copper/30 bg-transparent px-3 py-2 text-base"
          />
        </div>

        <ErrorMessage>{error}</ErrorMessage>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Log in
        </Button>
      </form>

      <Button variant="secondary" className="w-full" onClick={handleGoogleLogin}>
        Continue with Google
      </Button>

      <p className="text-center text-sm">
        New here?{' '}
        <Link href="/signup" className="font-medium text-chili">
          Create an account
        </Link>
      </p>
    </div>
  );
}
