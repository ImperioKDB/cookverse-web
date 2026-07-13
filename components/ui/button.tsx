import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

// Radius, states, and variants follow 06-design-system.md's
// "Elevation, radius & interaction states" section: 6px radius, 40% opacity
// + disabled attribute together, scale(0.97) press feedback.
const buttonVariants = cva(
  'inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium transition-colors active:scale-[0.97] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-chili text-flour hover:bg-chili/90',
        secondary:
          'border border-copper/40 text-[#241E1A] hover:bg-copper/10 dark:text-flour',
        ghost: 'text-[#241E1A] hover:bg-copper/10 dark:text-flour',
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-3',
        lg: 'h-12 px-8',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  /** Overrides the default Spinner + "Please wait". For a loading moment
      that deserves more personality than the default — most callers
      should leave this alone. */
  loadingIndicator?: React.ReactNode;
  asChild?: boolean;
}

const DefaultLoadingContent = (
  <span className="inline-flex items-center gap-2">
    <Spinner size={16} />
    Please wait
  </span>
);

/**
 * Three dots bubbling at staggered delays — opt-in via loadingIndicator for
 * a specific button that wants more personality than the default.
 */
export const SimmerDots = (
  <span className="inline-flex items-center gap-1" aria-hidden="true">
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
  </span>
);

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, loadingIndicator, asChild, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // asChild wraps a single caller-provided element (e.g. <Link>) — Slot
    // clones Button's props onto whatever single child it receives. Once
    // isLoading swaps that child for the loading span instead, the actual
    // <Link> (its href, its own children) silently vanishes rather than
    // erroring, which is worse: nothing crashes, the button just quietly
    // stops navigating anywhere. So: asChild always passes `children`
    // through untouched — disabled/aria-busy still apply — and the loading
    // treatment only replaces content on the plain-button path, where
    // there's no wrapped element to lose.
    const content = asChild ? children : isLoading ? (loadingIndicator ?? DefaultLoadingContent) : children;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {content}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
