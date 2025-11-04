'use client';

import { InfoIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

type InfoPopoverProps = {
  content: string | React.ReactNode;
  title?: string;
};

export function InfoPopover({ content, title }: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full hover:bg-muted/50 transition-colors">
          <InfoIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          <span className="sr-only">Bilgi</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-md" align="start" side="bottom">
        {title && <h4 className="mb-2 font-semibold text-sm text-foreground">{title}</h4>}
        <div className="text-sm leading-relaxed text-muted-foreground">{content}</div>
      </PopoverContent>
    </Popover>
  );
}
