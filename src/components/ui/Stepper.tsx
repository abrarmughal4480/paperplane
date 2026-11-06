import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Stepper({
  value,
  onChange,
  min = 1,
  max = 999,
  className,
  size = 'md',
}: StepperProps) {
  const isMin = value <= min;
  const isMax = value >= max;

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  };

  const btnClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center bg-muted/60 border border-border/70 rounded-xl overflow-hidden p-0.5 select-none shadow-subtle',
        sizeClasses[size],
        className
      )}
    >
      <button
        type="button"
        disabled={isMin}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(
          'flex items-center justify-center text-foreground hover:bg-card active:scale-95 transition-all rounded-lg disabled:opacity-30 disabled:pointer-events-none cursor-pointer',
          btnClasses[size]
        )}
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </button>

      <span className="min-w-[48px] text-center font-semibold tabular-nums text-foreground px-2">
        {value}
      </span>

      <button
        type="button"
        disabled={isMax}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(
          'flex items-center justify-center text-foreground hover:bg-card active:scale-95 transition-all rounded-lg disabled:opacity-30 disabled:pointer-events-none cursor-pointer',
          btnClasses[size]
        )}
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

