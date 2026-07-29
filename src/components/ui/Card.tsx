import * as React from 'react';

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md';
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  onClick,
}) => {
  const paddingClass = { none: '', sm: 'p-4', md: 'p-5' }[padding];
  return (
    <div
      className={[
        'bg-[var(--color-bg-surface)] border border-[var(--color-border)]',
        'rounded-[var(--radius-card)]',
        paddingClass,
        onClick
          ? 'cursor-pointer hover:border-[var(--color-border-strong)] transition-colors duration-[var(--duration-fast)]'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
};

// ─── Card Header ─────────────────────────────────────────────────────────────
export const CardHeader: React.FC<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => (
  <div className={['flex items-start justify-between mb-4', className].join(' ')}>
    <div>
      <h2 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
          {subtitle}
        </p>
      )}
    </div>
    {action && <div className="ml-3 shrink-0">{action}</div>}
  </div>
);

// ─── Separator ────────────────────────────────────────────────────────────────
export const Separator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr
    className={[
      'border-none border-t border-[var(--color-border)] my-0',
      className,
    ].join(' ')}
    aria-hidden="true"
  />
);

// ─── Progress Bar ─────────────────────────────────────────────────────────────
type ProgressVariant = 'default' | 'positive' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number;  // 0–100
  max?: number;
  variant?: ProgressVariant;
  size?: 'sm' | 'md';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const progressColors: Record<ProgressVariant, string> = {
  default:  'bg-[var(--color-accent)]',
  positive: 'bg-[var(--color-positive)]',
  warning:  'bg-[var(--color-warning)]',
  danger:   'bg-[var(--color-negative)]',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  label,
  showValue = false,
  className = '',
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const h = size === 'sm' ? 'h-1' : 'h-1.5';
  const barVariant =
    pct >= 100
      ? 'danger'
      : pct >= 85
      ? 'warning'
      : pct >= 70
      ? 'warning'
      : variant;

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="flex justify-between text-[var(--text-secondary)] text-[var(--color-text-secondary)] mb-1">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={['w-full rounded-full bg-[var(--color-bg-subtle)]', h].join(' ')}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={[
            'rounded-full transition-all duration-[var(--duration-standard)]',
            h,
            progressColors[barVariant],
          ].join(' ')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'positive' | 'negative' | 'warning' | 'info' | 'neutral';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}> = ({ children, variant = 'neutral', className = '' }) => {
  const styles: Record<BadgeVariant, string> = {
    positive: 'badge-positive',
    negative: 'badge-negative',
    warning:  'badge-warning',
    info:     'badge-info',
    neutral:  'badge-neutral',
  };
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-pill)]',
        'text-[var(--text-label)] font-medium whitespace-nowrap',
        styles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export const Skeleton: React.FC<{
  className?: string;
  height?: string | number;
  width?: string | number;
  rounded?: boolean;
}> = ({ className = '', height, width, rounded = false }) => (
  <div
    className={['skeleton', rounded ? 'rounded-full' : '', className].join(' ')}
    style={{ height, width }}
    aria-hidden="true"
  />
);

// ─── Spinner ─────────────────────────────────────────────────────────────────
export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={['animate-spin text-[var(--color-accent)]', className].join(' ')}
    aria-label="Loading"
    role="status"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => (
  <div
    className={[
      'flex flex-col items-center justify-center text-center py-12 px-6',
      className,
    ].join(' ')}
  >
    <div className="w-12 h-12 flex items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] mb-4">
      {icon}
    </div>
    <h3 className="text-[var(--text-section)] font-semibold text-[var(--color-text-primary)] mb-2">
      {title}
    </h3>
    <p className="text-[var(--text-body)] text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
      {description}
    </p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// ─── Error State ──────────────────────────────────────────────────────────────
export const ErrorState: React.FC<{
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ message, onRetry, className = '' }) => (
  <div
    className={[
      'flex flex-col items-center justify-center text-center py-10 px-6',
      className,
    ].join(' ')}
  >
    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-negative-soft)] text-[var(--color-negative)] mb-3">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>
    <p className="text-[var(--text-body)] text-[var(--color-text-secondary)]">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-3 text-[var(--text-button)] text-[var(--color-accent)] font-semibold hover:underline"
      >
        Try again
      </button>
    )}
  </div>
);

// ─── Amount Display ───────────────────────────────────────────────────────────
interface AmountDisplayProps {
  amount: number;
  masked?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  sign?: boolean;
  className?: string;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  masked = false,
  size = 'md',
  sign = false,
  className = '',
}) => {
  const { formatCurrency, formatSignedCurrency } = require('@/lib/currency/formatter');
  const formatted = sign ? formatSignedCurrency(amount) : formatCurrency(amount);

  const sizeClass = {
    sm: 'text-[var(--text-body)]',
    md: 'text-[var(--text-section)]',
    lg: 'text-2xl',
    xl: 'text-[var(--text-balance)]',
  }[size];

  const colorClass = sign
    ? amount >= 0
      ? 'text-[var(--color-positive)]'
      : 'text-[var(--color-negative)]'
    : '';

  return (
    <span
      className={[
        'font-semibold tabular-nums',
        sizeClass,
        colorClass,
        masked ? 'balance-masked select-none' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-financial
      aria-label={masked ? 'Balance hidden' : formatted}
    >
      {masked ? '৳ ••••••' : formatted}
    </span>
  );
};

// ─── Switch ───────────────────────────────────────────────────────────────────
import * as SwitchPrimitive from '@radix-ui/react-switch';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  id,
}) => {
  const generatedId = React.useId();
  const switchId = id || generatedId;
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div>
          {label && (
            <label
              htmlFor={switchId}
              className="text-[var(--text-body)] font-medium text-[var(--color-text-primary)] cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[var(--text-secondary)] text-[var(--color-text-secondary)] mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}
      <SwitchPrimitive.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={[
          'relative shrink-0 w-10 h-6 rounded-full transition-colors',
          'duration-[var(--duration-fast)]',
          'bg-[var(--color-border-strong)] data-[state=checked]:bg-[var(--color-accent)]',
          'focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
      >
        <SwitchPrimitive.Thumb
          className={[
            'block w-5 h-5 bg-white rounded-full shadow-sm',
            'transition-transform duration-[var(--duration-fast)]',
            'translate-x-0.5 data-[state=checked]:translate-x-[1.125rem]',
          ].join(' ')}
        />
      </SwitchPrimitive.Root>
    </div>
  );
};
