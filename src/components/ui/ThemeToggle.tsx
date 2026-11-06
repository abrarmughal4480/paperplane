import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { cn } from '../../utils/cn';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        'inline-flex items-center p-1 bg-muted/60 border border-border/60 rounded-xl gap-1 text-xs select-none',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={cn(
          'p-1.5 rounded-lg transition-all',
          theme === 'light'
            ? 'bg-card text-foreground shadow-subtle font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={cn(
          'p-1.5 rounded-lg transition-all',
          theme === 'dark'
            ? 'bg-card text-foreground shadow-subtle font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={cn(
          'p-1.5 rounded-lg transition-all',
          theme === 'system'
            ? 'bg-card text-foreground shadow-subtle font-semibold'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Auto (System Preference)"
      >
        <Laptop className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

