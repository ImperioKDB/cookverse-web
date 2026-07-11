import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MarketingHomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-char px-6 text-center text-flour">
      <h1 className="font-display text-5xl">CookVerse</h1>
      <p className="mt-4 max-w-md text-flour/80">
        The place where you learn to cook, not just watch someone else do it.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/signup">Get started</Link>
        </Button>
        <Button variant="secondary" className="border-flour/40 text-flour hover:bg-flour/10" asChild>
          <Link href="/login">Log in</Link>
        </Button>
      </div>
    </main>
  );
}
