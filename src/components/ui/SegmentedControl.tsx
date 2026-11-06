import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

export interface SegmentOption<T extends string> {
  label: string | React.ReactNode;
  value: T;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  id?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  id = 'segmented-control',
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'relative flex items-center p-1 bg-muted/80 backdrop-blur-sm rounded-xl border border-border/60 select-none',
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium transition-colors duration-150 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'text-foreground font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`${id}-active-pill`}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                className="absolute inset-0 bg-card rounded-lg shadow-elevation z-[-1] border border-border/40"
              />
            )}
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

