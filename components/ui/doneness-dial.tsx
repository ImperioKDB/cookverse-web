'use client';

import { cn } from '@/lib/utils';

// The one signature shape from 06-design-system.md, used for every
// "level/intensity" meaning in the product: difficulty, spice, cook-mode
// timers, XP/level rings, course progress, challenge countdowns. One SVG
// component, parameterized — never redrawn ad hoc per screen.
export type DialVariant = 'difficulty' | 'heat' | 'timer' | 'xp';

const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Expert'];
const DIFFICULTY_VALUES: Record<string, number> = { easy: 1, medium: 2, hard: 3, expert: 4 };

interface DonenessDialProps {
  variant: DialVariant;
  value: number;
  max: number;
  label?: string;
  size?: number;
  className?: string;
}

export function DonenessDial({ variant, value, max, label, size = 56, className }: DonenessDialProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const fraction = max > 0 ? clamped / max : 0;

  // 270° sweep, gap at the bottom — echoes a stove knob's off-position.
  const sweepDegrees = 270;
  const startAngle = 135; // degrees, measuring clockwise from 3 o'clock
  const radius = size / 2 - 6;
  const center = size / 2;

  const angleToPoint = (angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: center + radius * Math.cos(rad), y: center + radius * Math.sin(rad) };
  };

  const endAngle = startAngle + sweepDegrees * fraction;
  const start = angleToPoint(startAngle);
  const end = angleToPoint(endAngle);
  const trackEnd = angleToPoint(startAngle + sweepDegrees);
  const largeArc = sweepDegrees * fraction > 180 ? 1 : 0;
  const trackLargeArc = sweepDegrees > 180 ? 1 : 0;

  const color = variant === 'heat' ? '#C7401F' : variant === 'xp' ? '#D69A2D' : '#C7401F';

  return (
    <div className={cn('inline-flex flex-col items-center gap-1', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-hidden="true">
        <path
          d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${trackLargeArc} 1 ${trackEnd.x} ${trackEnd.y}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={4}
          strokeLinecap="round"
        />
        {fraction > 0 && (
          <path
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
          />
        )}
      </svg>
      {label && (
        <span className="font-mono text-xs text-[#241E1A]/70 dark:text-flour/70">{label}</span>
      )}
    </div>
  );
}

/** Convenience wrapper for the most common case: recipe/course difficulty. */
export function DifficultyDial({
  difficulty,
  size,
}: {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  size?: number;
}) {
  const value = DIFFICULTY_VALUES[difficulty] ?? 1;
  return (
    <DonenessDial
      variant="difficulty"
      value={value}
      max={4}
      label={DIFFICULTY_LABELS[value - 1]}
      size={size}
    />
  );
}
