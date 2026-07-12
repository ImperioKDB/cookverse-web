const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 60 * 60 * 24 * 365],
  ['month', 60 * 60 * 24 * 30],
  ['week', 60 * 60 * 24 * 7],
  ['day', 60 * 60 * 24],
  ['hour', 60 * 60],
  ['minute', 60],
];

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always', style: 'narrow' });

/**
 * "2h ago" / "3d ago" style relative time — compact and numeric, matching
 * the design system's convention of giving precise/numeric content (times,
 * quantities) a distinct, scannable voice rather than prose. Falls back to
 * a locale date once something is old enough that "ago" stops being useful
 * information (past a year — matches how most feeds treat the cutoff).
 */
export function relativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const seconds = Math.round((now - then) / 1000);

  if (seconds < 45) return 'just now';

  for (const [unit, unitSeconds] of UNITS) {
    if (seconds >= unitSeconds) {
      const value = Math.round(seconds / unitSeconds);
      if (unit === 'year') return new Date(isoDate).toLocaleDateString();
      return rtf.format(-value, unit);
    }
  }

  return 'just now';
}
