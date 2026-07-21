'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'signup';
type NavClickHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void;

// Matches the transition-duration below — kept as one constant so the JS
// timer and the CSS animation can never drift out of sync.
const FLIP_MS = 700;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  return reduced;
}

interface FlipFacesProps {
  /** 'x' = vertical turn (mobile, one column). 'y' = horizontal turn (desktop split panel). */
  axis: 'x' | 'y';
  showBack: boolean;
  frontLabel: string;
  backLabel: string;
  front: React.ReactNode;
  back: React.ReactNode;
  className?: string;
}

/**
 * Two faces stacked in the same grid cell, pre-rotated 180deg apart on the
 * given axis, so toggling `showBack` reads as a card physically turning
 * rather than content swapping. Both faces stay mounted the whole time —
 * that's what gives the animation something to rotate away from — but the
 * inactive one is pulled out of the tab order and the accessibility tree
 * with `inert`, so a keyboard or screen-reader user never lands in the
 * form that isn't visible.
 *
 * `prefers-reduced-motion` skips the 3D transform entirely and mounts only
 * the active face — per 06-design-system.md's existing rule that reduced
 * motion drops flourishes but keeps information.
 */
function FlipFaces({ axis, showBack, frontLabel, backLabel, front, back, className }: FlipFacesProps) {
  const reducedMotion = usePrefersReducedMotion();
  const rotateProp = axis === 'x' ? 'rotateX' : 'rotateY';

  if (reducedMotion) {
    return (
      <div className={className}>
        <span className="sr-only">{showBack ? backLabel : frontLabel}</span>
        {showBack ? back : front}
      </div>
    );
  }

  return (
    <div className={cn('relative [perspective:1600px]', className)}>
      <div
        className="grid transition-transform duration-700 ease-[cubic-bezier(.65,0,.35,1)] [transform-style:preserve-3d]"
        style={{ transform: `${rotateProp}(${showBack ? 180 : 0}deg)` }}
      >
        <div
          className="col-start-1 row-start-1 [backface-visibility:hidden]"
          aria-hidden={showBack || undefined}
          inert={showBack || undefined}
        >
          <span className="sr-only">{frontLabel}</span>
          {front}
        </div>
        <div
          className="col-start-1 row-start-1 [backface-visibility:hidden]"
          style={{ transform: `${rotateProp}(180deg)` }}
          aria-hidden={!showBack || undefined}
          inert={!showBack || undefined}
        >
          <span className="sr-only">{backLabel}</span>
          {back}
        </div>
      </div>
    </div>
  );
}

function AuthFace({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-copper/20 bg-flour p-6 shadow-sm dark:bg-char/95">
      {children}
    </div>
  );
}

interface AuthCardProps {
  /** Which form this route should render — set by the page, not chosen client-side. */
  mode: AuthMode;
}

/**
 * Renders at both /login and /signup. Each route mounts this with its own
 * `mode` so direct links, bookmarks, and the browser back/forward button
 * all land on the right form with no JS required. The flip only happens
 * for the *in-app* toggle click: it plays out entirely client-side first,
 * then navigates to the other route once the animation has already
 * finished on screen — so the swap looks instant and nothing flashes.
 */
export function AuthCard({ mode }: AuthCardProps) {
  const router = useRouter();
  const [visualMode, setVisualMode] = useState<AuthMode>(mode);
  const [isAnimating, setIsAnimating] = useState(false);

  // A direct navigation (typed URL, bookmark, back/forward) lands here as a
  // fresh mount with the right `mode` already — this just keeps visual
  // state honest if that ever fires on an already-mounted instance.
  useEffect(() => {
    setVisualMode(mode);
  }, [mode]);

  // Prefetch the other form so the post-animation navigation is instant
  // rather than a second loading beat stacked on top of the flip.
  useEffect(() => {
    router.prefetch(mode === 'login' ? '/signup' : '/login');
  }, [mode, router]);

  function goTo(next: AuthMode) {
    if (isAnimating || next === visualMode) return;
    const target = next === 'login' ? '/login' : '/signup';

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      router.push(target);
      return;
    }

    setIsAnimating(true);
    setVisualMode(next);

    window.setTimeout(() => {
      router.push(target);
      setIsAnimating(false);
    }, FLIP_MS);
  }

  function interceptedNav(next: AuthMode): NavClickHandler {
    return (event) => {
      // Only hijack a plain left-click — modified clicks (open in new tab,
      // etc.) and anything a browser extension already handled fall
      // through to the real <Link>, same as any other nav link.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      goTo(next);
    };
  }

  const loginContent = <LoginPanel onSwitchToSignup={interceptedNav('signup')} />;
  const signupContent = <SignupPanel onSwitchToLogin={interceptedNav('login')} />;

  return (
    <>
      {/* Mobile / tablet: single column, the whole card turns end over end. */}
      <div className="lg:hidden">
        <FlipFaces
          axis="x"
          showBack={visualMode === 'signup'}
          frontLabel="Log in"
          backLabel="Sign up"
          front={<AuthFace>{loginContent}</AuthFace>}
          back={<AuthFace>{signupContent}</AuthFace>}
        />
      </div>

      {/* Desktop: split panel — form on the left, CTA on the right, both
          sides turn together so it still reads as one card. */}
      <div className="hidden overflow-hidden rounded-lg border border-copper/20 shadow-sm lg:grid lg:grid-cols-2">
        <FlipFaces
          axis="y"
          showBack={visualMode === 'signup'}
          frontLabel="Log in"
          backLabel="Sign up"
          className="bg-flour p-10 dark:bg-char/95"
          front={loginContent}
          back={signupContent}
        />
        <FlipFaces
          axis="y"
          showBack={visualMode === 'signup'}
          frontLabel="New here?"
          backLabel="Welcome back"
          className="bg-char p-10 text-flour"
          front={
            <CtaPanel
              heading="New here?"
              body="Create a workspace for your recipes — save what you cook, follow other cooks, and start a streak."
              actionLabel="Create account"
              href="/signup"
              onClick={interceptedNav('signup')}
            />
          }
          back={
            <CtaPanel
              heading="Welcome back"
              body="Sign in to pick up where you left off."
              actionLabel="Sign in"
              href="/login"
              onClick={interceptedNav('login')}
            />
          }
        />
      </div>
    </>
  );
}

function CtaPanel({
  heading,
  body,
  actionLabel,
  href,
  onClick,
}: {
  heading: string;
  body: string;
  actionLabel: string;
  href: string;
  onClick: NavClickHandler;
}) {
  return (
    <div className="flex h-full flex-col justify-center">
      <p className="font-display text-3xl">{heading}</p>
      <p className="mt-3 text-sm text-flour/80">{body}</p>
      <Button asChild variant="secondary" className="mt-6 w-fit border-flour/40 text-flour hover:bg-flour/10">
        <Link href={href} onClick={onClick}>
          {actionLabel} →
        </Link>
      </Button>
    </div>
  );
}

// --- Login form -------------------------------------------------------
// Same logic as the pre-existing /login page, unchanged — only the input
// ids changed (see note below).

function LoginPanel({ onSwitchToSignup }: { onSwitchToSignup: NavClickHandler }) {
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
        <p className="mt-1 text-sm text-[#241E1A]/70 dark:text-flour/70">Log in to keep cooking.</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          {/* id prefixed "login-" because both forms are mounted at once
              for the flip — duplicate ids would break label association
              and screen-reader navigation. */}
          <label htmlFor="login-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="login-password"
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
        <Link href="/signup" onClick={onSwitchToSignup} className="font-medium text-chili">
          Create an account
        </Link>
      </p>
    </div>
  );
}

// --- Signup form ------------------------------------------------------
// Same logic as the pre-existing /signup page, unchanged — only the input
// ids changed, for the same reason as above.

function SignupPanel({ onSwitchToLogin }: { onSwitchToLogin: NavClickHandler }) {
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
          <label htmlFor="signup-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="signup-password"
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

        <ErrorMessage>{error}</ErrorMessage>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" onClick={onSwitchToLogin} className="font-medium text-chili">
          Log in
        </Link>
      </p>
    </div>
  );
}
