import { cn } from '@/lib/utils';

export function ErrorMessage({ children, className }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className={cn('text-sm text-chili', className)}>
      {children}
    </p>
  );
}
