'use client';

import { useTranslations } from 'next-intl';
import { InfoPopover } from '@/components/squarepad/info-popover';

type SectionHeaderProps = {
  translationKey: string;
  infoContent?: string | React.ReactNode;
  infoTitle?: string;
};

export function SectionHeader({ translationKey, infoContent, infoTitle }: SectionHeaderProps) {
  const t = useTranslations(`squarepad.headers.${translationKey}`);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-primary/80">{t('eyebrow')}</p>
        {infoContent && <InfoPopover content={infoContent} title={infoTitle} />}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
    </div>
  );
}
