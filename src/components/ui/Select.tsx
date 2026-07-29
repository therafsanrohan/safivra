import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { Label, FieldError, FieldDescription } from './Input';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SelectGroup {
  label?: string;
  options: SelectOption[];
}

interface SelectProps {
  options?: SelectOption[];
  groups?: SelectGroup[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  options,
  groups,
  value,
  onValueChange,
  placeholder = 'Select an option',
  label,
  description,
  error,
  required,
  optional,
  disabled,
  id,
  className = '',
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errId = error ? `${inputId}-err` : undefined;

  const allOptions = groups
    ? groups.flatMap((g) => g.options)
    : (options ?? []);
  const selectedOption = allOptions.find((o) => o.value === value);

  return (
    <div className="w-full">
      {label && (
        <Label htmlFor={inputId} required={required} optional={optional}>
          {label}
        </Label>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={inputId}
          aria-describedby={errId}
          aria-invalid={!!error}
          className={[
            'flex items-center justify-between w-full h-[var(--touch-target)] px-3',
            'rounded-[var(--radius-input)] bg-[var(--color-bg-surface)]',
            'border transition-colors duration-[var(--duration-fast)]',
            error
              ? 'border-[var(--color-negative)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-border-focus)]',
            'outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
            'text-[var(--text-body)] text-left',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'mt-1',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <SelectPrimitive.Value placeholder={
            <span className="text-[var(--color-text-placeholder)]">{placeholder}</span>
          }>
            {selectedOption?.label}
          </SelectPrimitive.Value>
          <SelectPrimitive.Icon>
            <ChevronDown size={16} className="text-[var(--color-text-muted)]" aria-hidden="true" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={[
              'z-50 w-[var(--radix-select-trigger-width)] overflow-hidden',
              'bg-[var(--color-bg-surface)] border border-[var(--color-border)]',
              'rounded-[var(--radius-card)] shadow-[var(--shadow-md)]',
              'max-h-64',
              'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
            ].join(' ')}
          >
            <SelectPrimitive.Viewport className="p-1">
              {groups
                ? groups.map((group, gi) => (
                    <SelectPrimitive.Group key={gi}>
                      {group.label && (
                        <SelectPrimitive.Label className="px-2 py-1 text-[var(--text-label)] text-[var(--color-text-muted)] font-medium">
                          {group.label}
                        </SelectPrimitive.Label>
                      )}
                      {group.options.map((opt) => (
                        <SelectItem key={opt.value} option={opt} />
                      ))}
                    </SelectPrimitive.Group>
                  ))
                : options?.map((opt) => <SelectItem key={opt.value} option={opt} />)}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && <FieldError id={errId}>{error}</FieldError>}
    </div>
  );
};

const SelectItem: React.FC<{ option: SelectOption }> = ({ option }) => (
  <SelectPrimitive.Item
    value={option.value}
    disabled={option.disabled}
    className={[
      'relative flex items-center px-2 py-2 rounded-[var(--radius-input)]',
      'text-[var(--text-body)] text-[var(--color-text-primary)]',
      'cursor-pointer select-none outline-none',
      'hover:bg-[var(--color-bg-subtle)] focus:bg-[var(--color-bg-subtle)]',
      'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
      'data-[state=checked]:text-[var(--color-accent)]',
      'min-h-[var(--touch-target)]',
    ].join(' ')}
  >
    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator className="absolute right-2">
      <Check size={14} aria-hidden="true" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
);
