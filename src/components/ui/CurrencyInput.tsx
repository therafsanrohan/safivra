import * as React from 'react';
import { APP_CONFIG } from '@/config/app';
import { Label, FieldError } from './Input';

interface CurrencyInputProps {
  value?: number | string;
  onChange?: (value: number) => void;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  min?: number;
  max?: number;
  className?: string;
  size?: 'md' | 'lg';
}

/**
 * A specialized amount input for BDT values.
 * - Uses numeric keyboard on mobile
 * - Displays ৳ prefix
 * - Prevents invalid characters
 * - Preserves exact decimal values
 * - Does not use floating-point for display
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      label,
      error,
      required,
      optional,
      placeholder = '0',
      disabled,
      id,
      min = 0,
      className = '',
      size = 'md',
    },
    ref
  ) => {
    const inputId = id ?? React.useId();
    const errId = error ? `${inputId}-err` : undefined;
    const symbol = APP_CONFIG.currency.symbol;

    const [displayValue, setDisplayValue] = React.useState(
      value != null && value !== '' ? String(value) : ''
    );

    // Keep display in sync with controlled value
    React.useEffect(() => {
      if (value != null && value !== '') {
        const numVal = Number(value);
        if (!isNaN(numVal)) {
          setDisplayValue(numVal === 0 ? '' : String(numVal));
        }
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      // Allow only digits and one decimal point
      if (raw !== '' && !/^\d*\.?\d{0,2}$/.test(raw)) return;

      setDisplayValue(raw);

      if (raw === '' || raw === '.') {
        onChange?.(0);
      } else {
        const num = parseFloat(raw);
        if (!isNaN(num)) {
          onChange?.(num);
        }
      }
    };

    const heightClass = size === 'lg' ? 'h-14 text-xl' : 'h-[var(--touch-target)]';

    return (
      <div className="w-full">
        {label && (
          <Label htmlFor={inputId} required={required} optional={optional}>
            {label}
          </Label>
        )}
        <div className="relative mt-1">
          <span
            className={[
              'absolute left-3 top-1/2 -translate-y-1/2 font-medium select-none pointer-events-none',
              'text-[var(--color-text-secondary)]',
              size === 'lg' ? 'text-xl' : 'text-[var(--text-body)]',
            ].join(' ')}
            aria-hidden="true"
          >
            {symbol}
          </span>
          <input
            ref={ref}
            id={inputId}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]{0,2}"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            aria-describedby={errId}
            aria-invalid={!!error}
            aria-label={label ? undefined : `Amount in ${APP_CONFIG.currency.code}`}
            data-financial
            className={[
              'w-full pl-7 pr-3 rounded-[var(--radius-input)]',
              'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]',
              'border transition-colors duration-[var(--duration-fast)]',
              'font-semibold tabular-nums',
              error
                ? 'border-[var(--color-negative)] focus:border-[var(--color-negative)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-border-focus)]',
              'outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
              'placeholder:text-[var(--color-text-placeholder)] placeholder:font-normal',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-bg-subtle)]',
              heightClass,
              className,
            ]
              .filter(Boolean)
              .join(' ')}
          />
        </div>
        {error && <FieldError id={errId}>{error}</FieldError>}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
