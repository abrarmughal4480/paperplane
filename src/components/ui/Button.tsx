import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow active:bg-primary/95',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border shadow-sm',
        outline:
          'border border-border bg-card hover:bg-muted text-foreground shadow-sm',
        ghost:
          'bg-muted text-foreground border border-border/70 hover:bg-muted/70 shadow-sm',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
        subtle:
          'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/60',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-12 px-6 text-base gap-2.5 rounded-xl',
        icon: 'h-9 w-9 p-0 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

