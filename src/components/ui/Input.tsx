import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

// ─── Label ────────────────────────────────────────────────────────────────────
interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean;
  optional?: boolean;
}

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className = '', required, optional, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={[
      'block text-[var(--text-label)] font-medium text-[var(--color-text-primary)]',
      'leading-[1.333] mb-1.5',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
    {required && (
      <span className="ml-0.5 text-[var(--color-negative)]" aria-hidden="true">
        {' '}*
      </span>
    )}
    {optional && !required && (
      <span className="ml-1 text-[var(--color-text-muted)] font-normal text-[11px]">
        (optional)
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = 'Label';

// ─── Field Description ────────────────────────────────────────────────────────
export const FieldDescription: React.FC<{ children: React.ReactNode; id?: string }> = ({
  children,
  id,
}) => (
  <p id={id} className="mt-1 text-[var(--text-secondary)] text-[var(--color-text-muted)] leading-snug">
    {children}
  </p>
);

// ─── Field Error ──────────────────────────────────────────────────────────────
export const FieldError: React.FC<{ children?: React.ReactNode; id?: string }> = ({
  children,
  id,
}) => {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-[var(--text-secondary)] text-[var(--color-negative)] leading-snug"
    >
      {String(children)}
    </p>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      description,
      error,
      required,
      optional,
      leftElement,
      rightElement,
      id,
      className = '',
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const descId = description ? `${inputId}-desc` : undefined;
    const errId = error ? `${inputId}-err` : undefined;

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required} optional={optional}>
            {label}
          </Label>
        )}
        {description && <FieldDescription id={descId}>{description}</FieldDescription>}
        <div className="relative mt-1">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
              {leftElement}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={[descId, errId].filter(Boolean).join(' ') || undefined}
            aria-invalid={!!error}
            required={required}
            className={[
              'w-full h-[var(--touch-target)] px-3 rounded-[var(--radius-input)]',
              'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]',
              'border transition-colors duration-[var(--duration-fast)]',
              error
                ? 'border-[var(--color-negative)] focus:border-[var(--color-negative)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-border-focus)]',
              'outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
              'placeholder:text-[var(--color-text-placeholder)]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-subtle)]',
              leftElement ? 'pl-9' : '',
              rightElement ? 'pr-9' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {rightElement}
            </div>
          )}
        </div>
        {error && <FieldError id={errId}>{error}</FieldError>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, description, error, required, optional, id, className = '', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errId = error ? `${inputId}-err` : undefined;

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required} optional={optional}>
            {label}
          </Label>
        )}
        {description && <FieldDescription>{description}</FieldDescription>}
        <textarea
          ref={ref}
          id={inputId}
          aria-describedby={errId}
          aria-invalid={!!error}
          rows={3}
          className={[
            'w-full px-3 py-2.5 rounded-[var(--radius-input)] resize-y min-h-[88px]',
            'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]',
            'border transition-colors duration-[var(--duration-fast)]',
            error
              ? 'border-[var(--color-negative)] focus:border-[var(--color-negative)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-border-focus)]',
            'outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
            'placeholder:text-[var(--color-text-placeholder)]',
            'mt-1',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && <FieldError id={errId}>{error}</FieldError>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
