import { GraduationCap } from 'lucide-react';

// The Learning Hub itself (courses, lessons, certificates) is Phase 3 scope
// per 07-roadmap-and-dev-plan.md — this exists so the nav item it's already
// linked from doesn't 404, not as a stand-in for the real feature.
export default function LearningPage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <GraduationCap className="h-10 w-10 text-copper" strokeWidth={1.5} />
      <h1 className="mt-4 font-display text-2xl">Learning Hub is on its way</h1>
      <p className="mt-2 text-sm text-[#241E1A]/60 dark:text-flour/60">
        Structured courses, technique tutorials, and certificates are coming in a later phase. For
        now, recipes and the people you follow are the best way to learn.
      </p>
    </div>
  );
}
