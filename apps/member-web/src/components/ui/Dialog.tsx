import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { X } from 'lucide-react';

// ─── Dialog ───────────────────────────────────────────────────────────────────
interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  hideTitle?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  hideTitle = false,
}) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={[
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'duration-[var(--duration-standard)]',
        ].join(' ')}
      />
      <DialogPrimitive.Content
        className={[
          'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-md mx-4',
          'bg-[var(--color-bg-surface)] rounded-[var(--radius-sheet)]',
          'shadow-[var(--shadow-md)] border border-[var(--color-border)]',
          'p-6 focus:outline-none',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'duration-[var(--duration-sheet)]',
          'max-h-[90svh] overflow-y-auto',
        ].join(' ')}
        aria-describedby={description ? 'dialog-desc' : undefined}
      >
        {hideTitle ? (
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          </VisuallyHidden.Root>
        ) : (
          <DialogPrimitive.Title className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)] mb-1">
            {title}
          </DialogPrimitive.Title>
        )}
        {description && (
          <DialogPrimitive.Description
            id="dialog-desc"
            className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-4"
          >
            {description}
          </DialogPrimitive.Description>
        )}
        {children}
        <DialogPrimitive.Close
          className={[
            'absolute top-4 right-4 p-1.5 rounded-[var(--radius-input)]',
            'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-bg-subtle)] transition-colors',
            'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
          ].join(' ')}
          aria-label="Close"
        >
          <X size={18} aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  hideTitle?: boolean;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  hideTitle = false,
}) => (
  <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={[
          'fixed inset-0 z-40 bg-black/40',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          'duration-[var(--duration-standard)]',
        ].join(' ')}
      />
      <DialogPrimitive.Content
        className={[
          'fixed z-50 bottom-0 left-0 right-0',
          'bg-[var(--color-bg-surface)] rounded-t-[var(--radius-sheet)]',
          'shadow-[var(--shadow-sheet)]',
          'focus:outline-none',
          'max-h-[92svh] flex flex-col',
          'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom',
          'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom',
          'duration-[var(--duration-sheet)]',
          'pb-[env(safe-area-inset-bottom,0)]',
        ].join(' ')}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-[var(--color-border-strong)]" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pb-3 shrink-0">
          <div>
            {hideTitle ? (
              <VisuallyHidden.Root>
                <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
              </VisuallyHidden.Root>
            ) : (
              <DialogPrimitive.Title className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
                {title}
              </DialogPrimitive.Title>
            )}
            {description && (
              <DialogPrimitive.Description className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            className={[
              'p-1.5 rounded-[var(--radius-input)] shrink-0 ml-4',
              'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
              'hover:bg-[var(--color-bg-subtle)] transition-colors',
            ].join(' ')}
            aria-label="Close"
          >
            <X size={18} aria-hidden="true" />
          </DialogPrimitive.Close>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-5 pb-6 flex-1">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
