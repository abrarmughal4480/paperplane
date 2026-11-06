// Shared popup/modal shell — every popup in PaperPlane uses this so all
// popups look and behave the same way:
// - obvious X button (top-right) + a footer action, never a bare overlay
// - Escape key closes, clicking the dark overlay closes
// - role="dialog" + aria-modal for screen readers, body scroll locked
// - one radius / one overlay darkness / one header style everywhere
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  labelledBy?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'max-w-md',
  labelledBy,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={title || labelledBy || 'Dialog'}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'w-full bg-card border border-border rounded-2xl shadow-floating overflow-hidden relative',
              maxWidth,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between gap-3 p-5 border-b border-border/80 bg-muted/40">
                <div className="min-w-0">
                  {title && (
                    <h3 className="text-base font-bold text-foreground">{title}</h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            {!title && !subtitle && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <div className="max-h-[70vh] overflow-y-auto">{children}</div>
            {footer && (
              <div className="p-4 border-t border-border/70 bg-muted/20">{footer}</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
