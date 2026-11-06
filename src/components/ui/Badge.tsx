import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import type { OrderStatus } from '../../data/mockData';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground border border-border/50',
        outline: 'text-foreground border border-border',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
        destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

// Enterprise Status Badge for Printing Queue
export function StatusBadge({ status }: { status: OrderStatus }) {
  const configs: Record<OrderStatus, { label: string; dot: string; bg: string; text: string }> = {
    queued: {
      label: 'Queued',
      dot: 'bg-zinc-400',
      bg: 'bg-zinc-500/10 border-zinc-500/20',
      text: 'text-zinc-600 dark:text-zinc-300',
    },
    printing: {
      label: 'Printing',
      dot: 'bg-primary animate-pulse',
      bg: 'bg-primary/10 border-primary/25',
      text: 'text-primary font-semibold',
    },
    ready: {
      label: 'Ready for Pickup',
      dot: 'bg-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/25',
      text: 'text-emerald-600 dark:text-emerald-400 font-semibold',
    },
    collected: {
      label: 'Collected',
      dot: 'bg-purple-500',
      bg: 'bg-purple-500/10 border-purple-500/20',
      text: 'text-purple-600 dark:text-purple-400',
    },
    cancelled: {
      label: 'Cancelled',
      dot: 'bg-red-500',
      bg: 'bg-red-500/10 border-red-500/20',
      text: 'text-red-600 dark:text-red-400',
    },
  };

  const config = configs[status] || configs.queued;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors select-none',
        config.bg,
        config.text
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}

