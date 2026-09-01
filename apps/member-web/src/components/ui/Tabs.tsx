import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { fullWidth?: boolean }
>(({ className = '', fullWidth = false, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={[
      'inline-flex items-center justify-center p-1 rounded-[var(--radius-button)] bg-[var(--color-bg-subtle)] text-[var(--color-text-secondary)]',
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ')}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className = '', ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={[
      'flex-1 inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5',
      'text-[var(--text-button)] font-medium transition-all duration-[var(--duration-fast)]',
      'rounded-[calc(var(--radius-button)-2px)] outline-none',
      'data-[state=active]:bg-[var(--color-bg-surface)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow-sm',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    ].join(' ')}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className = '', ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={['mt-3 outline-none', className].join(' ')}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
