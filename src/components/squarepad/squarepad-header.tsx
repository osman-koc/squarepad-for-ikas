'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

type SquarePadHeaderProps = {
  tokenError: string | null;
};

export function SquarePadHeader({ tokenError }: SquarePadHeaderProps) {
  const t = useTranslations('squarepad');

  return (
    <header className="rounded-2xl border border-muted/60 bg-gradient-to-b from-background via-background/95 to-muted/20 p-6 shadow-sm">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Image alt="SquarePad Logo" className="h-12 w-12 rounded-xl border border-muted bg-card p-1 shadow-sm" height={48} width={48} src="/square-logo.svg" />
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SquarePad</span>
            <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          </div>
        </div>
        <div className="space-y-3 md:max-w-sm md:text-right">
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground md:justify-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-muted/60 bg-background/80 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('features.catalog')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-muted/60 bg-background/80 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('features.imageUrl')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-muted/60 bg-background/80 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t('features.xmlFeed')}
            </span>
          </div>
        </div>
      </div>
      {tokenError ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{tokenError}</p>
      ) : null}
    </header>
  );
}
