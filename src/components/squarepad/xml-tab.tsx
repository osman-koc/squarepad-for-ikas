'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InfoTooltip } from '@/components/squarepad/info-tooltip';
import { InlineHint } from '@/components/squarepad/inline-hint';
import { SectionHeader } from '@/components/squarepad/section-header';
import { ALIGN_OPTIONS, FORMAT_OPTIONS } from '@/constants/squarepad';
import type { AlignOption, FormatOption } from '@/types/squarepad';
import type { CopyFeedback } from '@/types/ui';

type XmlFormState = {
  source: string;
  size: string;
  bg: string;
  align: AlignOption;
  format: FormatOption;
};

type XmlTabProps = {
  hasToken: boolean;
  form: XmlFormState;
  bgDraft: string;
  onFormUpdate: (changes: Partial<XmlFormState>) => void;
  onBgDraftChange: (value: string, commit?: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  shareUrl: string | null;
  preview: string;
  productCount: number;
  onCopyShareUrl: () => void;
  copyPresentation: CopyFeedback;
};

export function XmlTab({
  hasToken,
  form,
  bgDraft,
  onFormUpdate,
  onBgDraftChange,
  onSubmit,
  loading,
  error,
  shareUrl,
  preview,
  productCount,
  onCopyShareUrl,
  copyPresentation,
}: XmlTabProps) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader
          eyebrow="XML Feed"
          title="XML feed'inizi kare görsellerle güncelleyin"
          description="Kaynak XML'i girin, kare görsel parametrelerini belirleyin ve güncellenmiş çıktıyı indirin."
        />
      </CardHeader>
      <CardContent>
        <InlineHint>
          XML dönüştürme, ikas&apos;ın Product Exporter uygulaması tarafından oluşturulan XML&apos;i dönüştürmek üzerine kurgulanmıştır. Bu XML&apos;deki{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">&lt;g:image_link&gt;</code> ve{' '}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">&lt;g:additional_image_link&gt;</code> tag&apos;lerinde yer alan görsel linklerini 1:1
          formatlanmış halleriyle değiştirerek yeni bir xml linki oluşturuyor.
        </InlineHint>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="xml-source-input">
                Kaynak XML URL&apos;si
                <InfoTooltip message="Kare görsellerle güncellenecek ürün feed’inin adresini girin." />
              </label>
              <Input
                id="xml-source-input"
                placeholder="https://example.com/feed.xml"
                value={form.source}
                onChange={(event) => onFormUpdate({ source: event.target.value })}
                onInvalid={(event) => event.currentTarget.setCustomValidity('Lütfen kaynak XML URL’sini girin.')}
                onInput={(event) => event.currentTarget.setCustomValidity('')}
                required
              />
              <p className="text-xs text-muted-foreground">Feed, kare görsellerle güncellenecek ve aynı parametrelerle paylaşılabilir bağlantı oluşturulacak.</p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="xml-size-input">
                Çıktı Boyutu (px)
                <InfoTooltip message="Kare görsellerin piksel boyutlarını ayarlayın." />
              </label>
              <Input
                id="xml-size-input"
                type="number"
                min={128}
                max={2048}
                value={form.size}
                onChange={(event) => onFormUpdate({ size: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="xml-align-select">
                Yerleşim
                <InfoTooltip message="Görsel kare alan içinde nasıl hizalansın?" />
              </label>
              <select
                id="xml-align-select"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                value={form.align}
                onChange={(event) => onFormUpdate({ align: event.target.value as AlignOption })}
              >
                {ALIGN_OPTIONS.map((align) => (
                  <option key={align} value={align}>
                    {align}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="xml-format-select">
                Format
                <InfoTooltip message="Çıktı dosya türünü belirleyin. Auto seçeneği tarayıcı uyumuna göre karar verir." />
              </label>
              <select
                id="xml-format-select"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                value={form.format}
                onChange={(event) => onFormUpdate({ format: event.target.value as FormatOption })}
              >
                {FORMAT_OPTIONS.map((format) => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="xml-bg-input">
                Arka Plan
                <InfoTooltip message="Kare içindeki boş alanların rengini seçin." />
              </label>
              <div className="flex items-center gap-3">
                <Input
                  id="xml-bg-input"
                  className="max-w-[120px]"
                  type="color"
                  value={form.bg}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    onBgDraftChange(nextValue, true);
                    onFormUpdate({ bg: nextValue });
                  }}
                />
                <Input
                  aria-label="Arka plan hex"
                  className="max-w-[140px]"
                  value={bgDraft.toUpperCase()}
                  onChange={(event) => {
                    const raw = event.target.value.replace(/[^0-9A-Fa-f#]/g, '');
                    const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
                    const trimmed = withoutHash.slice(0, 6);
                    const withHash = `#${trimmed.toLowerCase()}`;
                    onBgDraftChange(withHash);
                    if (trimmed.length === 6) {
                      onFormUpdate({ bg: withHash });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading || !hasToken}>
              {loading ? 'Dönüştürülüyor…' : 'XML Feed’i Güncelle'}
            </Button>
          </div>

          {(shareUrl || preview) && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              {shareUrl ? (
                <div className="space-y-4 rounded-lg border border-muted/70 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Paylaşılabilir bağlantı</p>
                      <p className="text-xs text-muted-foreground">Bu URL’yi paylaşarak kare görsellerle güncellenmiş feed’i servis edin.</p>
                    </div>
                    <Button type="button" variant={copyPresentation.variant} size="sm" onClick={onCopyShareUrl}>
                      {copyPresentation.label}
                    </Button>
                  </div>
                  <p className="break-all rounded-md border border-muted/80 bg-background/90 px-3 py-2 text-xs text-muted-foreground">{shareUrl}</p>
                  {productCount > 0 ? (
                    <p className="text-sm text-muted-foreground">{productCount} ürün bulundu ve işlendi.</p>
                  ) : null}
                  {copyPresentation.message ? (
                    <span aria-live="polite" className="text-[11px] text-muted-foreground">
                      {copyPresentation.message}
                    </span>
                  ) : null}
                </div>
              ) : null}

              {preview ? (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Önizleme</p>
                    <p className="text-xs text-muted-foreground">XML çıktısının ilgili bölümlerini kontrol edin.</p>
                  </div>
                  <pre className="relative max-h-96 overflow-auto rounded-lg border border-border bg-[#0f1524] p-4 text-xs text-[#E8EFFE] shadow-lg ring-1 ring-black/5 before:absolute before:left-4 before:top-4 before:flex before:gap-1 before:rounded-full before:bg-transparent before:content-['']">
                    <span className="absolute left-4 top-3 flex gap-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
                    </span>
                    <code className="block whitespace-pre-wrap break-words bg-transparent pl-0 pt-6 text-left text-xs font-mono text-inherit" data-language="xml">
                      <span className="text-[#59a6ff]">&lt;?xml</span>
                      <span className="text-[#fdb784]"> version=</span>
                      <span className="text-[#f8d273]">&quot;1.0&quot;</span>
                      <span className="text-[#fdb784]"> encoding=</span>
                      <span className="text-[#f8d273]">&quot;UTF-8&quot;</span>
                      <span className="text-[#59a6ff]">?&gt;</span>
                      {'\n'}
                      {preview
                        .split('\n')
                        .filter((line, index) => !(index === 0 && line.startsWith('<?xml')))
                        .map((line, index) => {
                          const trimmed = line.trim();
                          if (!trimmed) {
                            return '\n';
                          }

                          const indent = line.match(/^\s*/)?.[0] ?? '';
                          const safeIndent = indent.replace(/\s/g, '\u00A0');
                          const isClosing = trimmed.startsWith('</');
                          const isSelfClosing = trimmed.endsWith('/>');

                          return (
                            <span key={`${line}-${index}`} className="block text-[#d1dcff]">
                              <span dangerouslySetInnerHTML={{ __html: safeIndent }} />
                              {trimmed.replace(/(&lt;\/?)([^&\s>]+)([^&]*?)(\/?&gt;)/g, (_match: string, open: string, tagName: string, attrs: string, close: string) => {
                                const attrFormatted = attrs.replace(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(\s*=\s*)("[^"]*"|'[^']*')/g, (_attrMatch: string, attrName: string, equals: string, value: string) => {
                                  const safeValue = value.replace(/"/g, '&quot;');
                                  return `<span class="text-[#86e1c4]">${attrName}</span>${equals}<span class="text-[#f8d273]">${safeValue}</span>`;
                                });

                                return `<span class="${isClosing ? 'text-[#ff7f90]' : 'text-[#59a6ff]'}">${open}${tagName}${attrFormatted}${close}</span>`;
                              })}
                              {isSelfClosing || isClosing ? '' : ''}
                            </span>
                          );
                        })}
                    </code>
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
