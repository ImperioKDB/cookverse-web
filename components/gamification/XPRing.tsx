import { DonenessDial } from '@/components/ui/doneness-dial';

interface XPRingProps {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  size?: number;
}

/**
 * Thin wrapper around DonenessDial's 'xp' variant — the shape was already
 * parameterized for this in 06-design-system.md ("XP/Level ring: thin
 * version of the same dial wraps a user's avatar, filling toward the next
 * level"), it just wasn't wired to anything yet. No new visual language.
 *
 * `xp_into_level` and `xp_for_next_level` are both "distance into the
 * current level" units (see GamificationService.getSummary()) — same unit,
 * so they map directly onto the dial's value/max without conversion.
 */
export function XPRing({ level, xpIntoLevel, xpForNextLevel, size = 40 }: XPRingProps) {
  return (
    <DonenessDial
      variant="xp"
      value={xpIntoLevel}
      max={Math.max(xpForNextLevel, 1)} // guard against a zero-width band at level 1
      label={`Lv ${level}`}
      size={size}
    />
  );
}
