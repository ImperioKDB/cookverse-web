'use client';

import { useEffect, useState } from 'react';

const DEFAULT_MESSAGES = ['Setting the table…', 'Preheating…', 'Tying your apron…', 'Almost ready…'];

/**
 * A richer loading treatment for a "big moment" CTA (onboarding's Continue,
 * a recipe's Publish) — the plain Spinner is the right default everywhere
 * else, but these specific actions are worth a bit more personality.
 * Reuses the same rounded-arc language as Spinner/DonenessDial rather than
 * inventing a new shape.
 */
export function LoadingDial({ size = 20, messages = DEFAULT_MESSAGES }: { size?: number; messages?: string[] }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setMessageIndex((i) => (i + 1) % messages.length), 1400);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0 animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
      </svg>
      <span aria-live="polite">{messages[messageIndex]}</span>
    </span>
  );
}
