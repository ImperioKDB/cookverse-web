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
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // Exactly one child expression, always — `Slot` (used via `asChild`)
    // requires a single React element child to clone its props onto.
    // Splitting the spinner and label into sibling expressions broke that
    // in an earlier draft of this component; wrapping both in one <span>
    // here keeps it to one child either way.
    const content = isLoading ? (
      <span className="inline-flex items-center gap-2">
        <Spinner size={16} />
        Please wait
      </span>
    ) : (
      children
    );

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
