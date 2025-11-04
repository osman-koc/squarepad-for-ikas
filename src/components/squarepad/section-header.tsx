'use client';

import { useTranslations } from 'next-intl';

type SectionHeaderProps = {
  translationKey: string;
};

export function SectionHeader({ translationKey }: SectionHeaderProps) {
  const t = useTranslations(`squarepad.headers.${translationKey}`);
  
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-primary/80">{t('eyebrow')}</p>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
    </div>
  );
}
