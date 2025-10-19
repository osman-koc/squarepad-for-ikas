'use client';

import { Info } from 'lucide-react';
import { useState } from 'react';

type InfoTooltipProps = {
  message: string;
};

export function InfoTooltip({ message }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => event.preventDefault()}
        aria-label={message}
      >
        <Info aria-hidden="true" className="h-3.5 w-3.5" focusable="false" />
      </button>
      {open ? (
        <span className="pointer-events-none absolute left-full top-0 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
          {message}
        </span>
      ) : null}
    </span>
  );
}
