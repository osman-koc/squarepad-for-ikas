'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { InfoTooltip } from '@/components/squarepad/info-tooltip';
import { ALIGN_OPTIONS, FORMAT_OPTIONS } from '@/constants/squarepad';
import type { AlignOption, FormatOption } from '@/types/squarepad';

type CommonFormFieldsProps = {
  size: string;
  align: AlignOption;
  format: FormatOption;
  bgDraft: string;
  onSizeChange: (value: string) => void;
  onAlignChange: (value: AlignOption) => void;
  onFormatChange: (value: FormatOption) => void;
  onBgDraftChange: (value: string, commit?: boolean) => void;
  tooltipType?: 'default' | 'xml';
};

export function CommonFormFields({
  size,
  align,
  format,
  bgDraft,
  onSizeChange,
  onAlignChange,
  onFormatChange,
  onBgDraftChange,
  tooltipType = 'default',
}: CommonFormFieldsProps) {
  const t = useTranslations('squarepad.form');

  return (
    <>
      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor={`size-input-${tooltipType}`}>
          {t('size.label')}
          <InfoTooltip message={tooltipType === 'xml' ? t('size.tooltipXml') : t('size.tooltip')} />
        </label>
        <Input
          id={`size-input-${tooltipType}`}
          type="number"
          min={128}
          max={2048}
          value={size}
          onChange={(e) => onSizeChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor={`align-select-${tooltipType}`}>
          {t('align.label')}
          <InfoTooltip message={t('align.tooltip')} />
        </label>
        <select
          id={`align-select-${tooltipType}`}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={align}
          onChange={(e) => onAlignChange(e.target.value as AlignOption)}
        >
          {ALIGN_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`align.options.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor={`format-select-${tooltipType}`}>
          {t('format.label')}
          <InfoTooltip message={t('format.tooltip')} />
        </label>
        <select
          id={`format-select-${tooltipType}`}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          value={format}
          onChange={(e) => onFormatChange(e.target.value as FormatOption)}
        >
          {FORMAT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(`format.options.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor={`bg-input-${tooltipType}`}>
          {t('background.label')}
          <InfoTooltip message={t('background.tooltip')} />
        </label>
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-12 flex-shrink-0 rounded-md border border-muted shadow-sm"
            style={{ backgroundColor: bgDraft.startsWith('#') ? bgDraft : `#${bgDraft}` }}
          />
          <Input
            id={`bg-input-${tooltipType}`}
            placeholder={t('background.placeholder')}
            value={bgDraft}
            onChange={(e) => onBgDraftChange(e.target.value)}
            onBlur={() => onBgDraftChange(bgDraft, true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onBgDraftChange(bgDraft, true);
              }
            }}
          />
        </div>
      </div>
    </>
  );
}
