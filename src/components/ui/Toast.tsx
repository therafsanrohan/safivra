import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((opts: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...opts, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const ctx: ToastContextValue = React.useMemo(
    () => ({
      toast: addToast,
      success: (title, description) => addToast({ title, description, variant: 'success' }),
      error: (title, description) => addToast({ title, description, variant: 'error' }),
      warning: (title, description) => addToast({ title, description, variant: 'warning' }),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={ctx}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        <ToastPrimitive.Viewport
          className="fixed bottom-[calc(var(--nav-height)+var(--space-4))] right-4 z-50 flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm"
          aria-label="Notifications"
        />
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} />
        ))}
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-[var(--color-positive)]" aria-hidden="true" />,
  error:   <XCircle size={18} className="text-[var(--color-negative)]" aria-hidden="true" />,
  warning: <AlertTriangle size={18} className="text-[var(--color-warning)]" aria-hidden="true" />,
  info:    <CheckCircle size={18} className="text-[var(--color-info)]" aria-hidden="true" />,
};

const ToastItem: React.FC<{ toast: Toast }> = ({ toast }) => {
  const variant = toast.variant ?? 'info';
  return (
    <ToastPrimitive.Root
      defaultOpen
      className={[
        'flex items-start gap-3 p-3.5 rounded-[var(--radius-card)]',
        'bg-[var(--color-bg-surface)] border border-[var(--color-border)]',
        'shadow-[var(--shadow-md)] w-full',
        'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2 data-[state=open]:fade-in',
        'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-full data-[state=closed]:fade-out',
        'duration-[var(--duration-standard)]',
      ].join(' ')}
    >
      <div className="shrink-0 mt-0.5">{icons[variant]}</div>
      <div className="flex-1 min-w-0">
        <ToastPrimitive.Title className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)]">
          {toast.title}
        </ToastPrimitive.Title>
        {toast.description && (
          <ToastPrimitive.Description className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
            {toast.description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close
        className="shrink-0 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        aria-label="Dismiss"
      >
        <X size={16} aria-hidden="true" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
