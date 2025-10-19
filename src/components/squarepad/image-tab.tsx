'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InfoTooltip } from '@/components/squarepad/info-tooltip';
import { SectionHeader } from '@/components/squarepad/section-header';
import { ALIGN_OPTIONS, FORMAT_OPTIONS } from '@/constants/squarepad';
import type { AlignOption, FormatOption } from '@/types/squarepad';
import type { CopyFeedback } from '@/types/ui';

type ImageFormState = {
  img: string;
  size: string;
  bg: string;
  align: AlignOption;
  format: FormatOption;
};

type ImageTabProps = {
  hasToken: boolean;
  form: ImageFormState;
  bgDraft: string;
  onFormUpdate: (changes: Partial<ImageFormState>) => void;
  onBgDraftChange: (value: string, commit?: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
  error: string | null;
  previewUrl: string | null;
  shareUrl: string | null;
  onCopyShareUrl: () => void;
  copyPresentation: CopyFeedback;
};

export function ImageTab({
  hasToken,
  form,
  bgDraft,
  onFormUpdate,
  onBgDraftChange,
  onSubmit,
  loading,
  error,
  previewUrl,
  shareUrl,
  onCopyShareUrl,
  copyPresentation,
}: ImageTabProps) {
  return (
    <Card>
      <CardHeader>
        <SectionHeader eyebrow="Görsel URL" title="Bir görsel bağlantısını kare formata dönüştürün" description="Herhangi bir görsel URL’sini girin, hizalama ve arka plan tercihlerini belirleyin." />
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="image-url-input">
                Görsel URL
              </label>
              <Input
                id="image-url-input"
                placeholder="https://cdn.ikas.com/media/product-image.jpg"
                value={form.img}
                onChange={(event) => onFormUpdate({ img: event.target.value })}
                onInvalid={(event) => event.currentTarget.setCustomValidity('Lütfen dönüştürülecek görsel URL’sini girin.')}
                onInput={(event) => event.currentTarget.setCustomValidity('')}
                required
              />
              <p className="text-xs text-muted-foreground">CDN veya ürün sayfası üzerindeki görsel bağlantısını doğrudan kullanabilirsiniz.</p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="image-size-input">
                Çıktı Boyutu (px)
                <InfoTooltip message="Kare görselin genişlik ve yüksekliğini piksel cinsinden belirler." />
              </label>
              <Input
                id="image-size-input"
                type="number"
                min={128}
                max={2048}
                value={form.size}
                onChange={(event) => onFormUpdate({ size: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="image-align-select">
                Yerleşim
                <InfoTooltip message="Görsel kare alan içinde nasıl hizalansın?" />
              </label>
              <select
                id="image-align-select"
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
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="image-format-select">
                Format
                <InfoTooltip message="Çıktı dosya türünü seçin. Auto seçeneği tarayıcıya göre uygun formatı üretir." />
              </label>
              <select
                id="image-format-select"
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
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="image-bg-input">
                Arka Plan
                <InfoTooltip message="Kare içinde kalan boşlukların rengini ayarlayın." />
              </label>
              <div className="flex items-center gap-3">
                <Input
                  id="image-bg-input"
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

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={loading || !hasToken}>
              {loading ? 'Oluşturuluyor…' : 'Kare Görseli Oluştur'}
            </Button>
          </div>

          {previewUrl && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,260px)]">
              <div className="space-y-4 rounded-lg border border-muted/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Paylaşılabilir bağlantı</p>
                    <p className="text-xs text-muted-foreground">URL’yi paylaşın veya otomasyonlarınıza ekleyin.</p>
                  </div>
                  <Button type="button" variant={copyPresentation.variant} size="sm" onClick={onCopyShareUrl} disabled={!shareUrl}>
                    {copyPresentation.label}
                  </Button>
                </div>
                <p className="break-all rounded-md border border-muted/80 bg-background/90 px-3 py-2 text-xs text-muted-foreground">{shareUrl ?? previewUrl}</p>
                {copyPresentation.message ? (
                  <span aria-live="polite" className="text-[11px] text-muted-foreground">
                    {copyPresentation.message}
                  </span>
                ) : null}
              </div>

              <div className="space-y-4 rounded-lg border border-dashed border-muted bg-muted/20 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Önizleme</p>
                  <p className="text-xs text-muted-foreground">Seçilen görselin kare versiyonunu kontrol edin.</p>
                </div>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex h-56 w-56 items-center justify-center rounded-md border border-muted/80 bg-background/80 p-2 shadow-sm">
                    <Image alt="Kare görsel önizleme" className="h-[200px] w-[200px] rounded object-contain" height={200} width={200} src={previewUrl} unoptimized />
                  </div>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <a download href={previewUrl} rel="noreferrer" target="_blank">
                      Görseli indir
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
