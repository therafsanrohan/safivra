import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Info } from 'lucide-react';

interface InfoPopoverProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export const InfoPopover: React.FC<InfoPopoverProps> = ({
  content,
  side = 'top',
  align = 'center',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setOpen((prev) => !prev);
          }}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors inline-flex align-middle rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-border-focus)]"
          aria-label="More information"
        >
          <Info size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align={align}
          sideOffset={5}
          className="z-[70] w-64 rounded-[var(--radius-card)] bg-[var(--color-bg-surface)] p-3 text-sm text-[var(--color-text-secondary)] shadow-xl border border-[var(--color-border)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {content}
          <Popover.Arrow className="fill-[var(--color-border)]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
