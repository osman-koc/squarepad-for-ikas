'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SectionHeader } from '@/components/squarepad/section-header';
import { InfoTooltip } from '@/components/squarepad/info-tooltip';
import { InlineHint } from '@/components/squarepad/inline-hint';
import { ALIGN_OPTIONS, FORMAT_OPTIONS } from '@/constants/squarepad';
import type { AlignOption, FormatOption, ProductImageOption, ProductSummary } from '@/types/squarepad';
import type { CopyFeedback } from '@/types/ui';

type ProductFormState = {
  size: string;
  bg: string;
  align: AlignOption;
  format: FormatOption;
};

type ProductTabProps = {
  hasToken: boolean;
  form: ProductFormState;
  bgDraft: string;
  onFormUpdate: (changes: Partial<ProductFormState>) => void;
  onBgDraftChange: (value: string, commit?: boolean) => void;
  onOpenSelection: () => void;
  onClearSelection: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  listLoading: boolean;
  listError: string | null;
  selectedProduct: ProductSummary | null;
  selectedProductImage: ProductImageOption | null;
  selectedProductImages: ProductImageOption[];
  productImagesLoading: boolean;
  loading: boolean;
  error: string | null;
  previewUrl: string | null;
  shareUrl: string | null;
  onCopyShareUrl: () => void;
  copyPresentation: CopyFeedback;
  onSelectProductImage: (image: ProductImageOption) => void;
};

export function ProductTab({
  hasToken,
  form,
  bgDraft,
  onFormUpdate,
  onBgDraftChange,
  onOpenSelection,
  onClearSelection,
  onSubmit,
  listLoading,
  listError,
  selectedProduct,
  selectedProductImage,
  selectedProductImages,
  productImagesLoading,
  loading,
  error,
  previewUrl,
  shareUrl,
  onCopyShareUrl,
  copyPresentation,
  onSelectProductImage,
}: ProductTabProps) {
  const previewImageContainer = useMemo(
    () => (
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-56 w-56 items-center justify-center rounded-md border border-muted/80 bg-background/80 p-2 shadow-sm">
          <Image alt="Ürün kare görseli" className="h-[200px] w-[200px] rounded object-contain" height={200} width={200} src={previewUrl!} unoptimized />
        </div>
        <Button asChild size="sm" variant="outline" className="w-full">
          <a download href={previewUrl!} rel="noreferrer" target="_blank">
            Görseli indir
          </a>
        </Button>
      </div>
    ),
    [previewUrl],
  );

  return (
    <Card>
      <CardHeader>
        <SectionHeader
          eyebrow="Ürün Katalog"
          title="Katalogdan ürün seçerek kare görsel oluşturun"
          description="Ürünleri arayın, görsellerini inceleyin ve kare formata dönüştürmek istediğiniz görseli seçin."
        />
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-1 text-sm font-medium text-foreground">
                <span>Katalogdan Ürün ve Görsel Seçimi</span>
                <InfoTooltip message="Ürün seçme penceresini açarak katalogdaki ürünleri ve görsellerini inceleyin." />
              </div>
              <InlineHint>Ürün adı, ID veya SKU ile arama yapabilir; seçtiğiniz ürünün görsellerini onay penceresi içinden yönetebilirsiniz.</InlineHint>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" disabled={!hasToken || listLoading} onClick={onOpenSelection}>
                  {listLoading ? 'Ürünler yükleniyor…' : 'Ürün Seç'}
                </Button>
                {listError && <span className="text-sm text-destructive">{listError}</span>}
                {selectedProduct && (
                  <Button type="button" variant="ghost" size="sm" onClick={onClearSelection}>
                    Seçimi Temizle
                  </Button>
                )}
              </div>
            </div>

            {selectedProduct ? (
              <div className="md:col-span-2 space-y-4 rounded-lg border border-muted bg-muted/10 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{selectedProduct.name}</h3>
                    <p className="text-xs text-muted-foreground">SKU: {selectedProduct.variants.find((variant) => variant.sku)?.sku ?? 'Bilgi yok'}</p>
                  </div>
                  {selectedProductImage ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Görsel seçildi</span> : null}
                </div>

                {productImagesLoading ? (
                  <p className="text-xs text-muted-foreground">Ürün görselleri yükleniyor…</p>
                ) : selectedProductImages.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {selectedProductImages.map((image, index) => {
                      const isActive = selectedProductImage?.imageId === image.imageId;
                      return (
                        <button
                          type="button"
                          key={`${selectedProduct.id}-${image.imageId}`}
                          onClick={() => onSelectProductImage(image)}
                          className={`group relative flex w-32 flex-col items-center gap-2 rounded-md border p-2 transition ${
                            isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-muted bg-background hover:border-primary/50'
                          }`}
                        >
                          <Image
                            alt={image.isMain ? 'Ana görsel' : `Görsel ${index + 1}`}
                            className="h-20 w-full rounded object-contain"
                            height={80}
                            width={120}
                            src={image.url}
                            unoptimized
                          />
                          <span className="text-[11px] text-muted-foreground">{image.isMain ? 'Ana Görsel' : `Görsel ${index + 1}`}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Bu ürüne ait görsel bulunamadı.</p>
                )}
              </div>
            ) : (
              <div className="md:col-span-2">
                <InlineHint>Ürün Seç butonu ile kataloğu açın; seçim yaptığınızda ürün ve görsel detayları burada listelenir.</InlineHint>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="product-size-input">
                Çıktı Boyutu (px)
                <InfoTooltip message="Kare görselin genişlik ve yüksekliğini piksel cinsinden belirler." />
              </label>
              <Input
                id="product-size-input"
                type="number"
                min={128}
                max={2048}
                value={form.size}
                onChange={(event) => onFormUpdate({ size: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="product-align-select">
                Yerleşim
                <InfoTooltip message="Görsel kare alan içinde hangi yönde hizalansın?" />
              </label>
              <select
                id="product-align-select"
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
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="product-format-select">
                Format
                <InfoTooltip message="Çıktı dosya türünü seçin. Auto seçeneği tarayıcı yeteneklerine göre en uygun formatı döndürür." />
              </label>
              <select
                id="product-format-select"
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
              <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="product-bg-input">
                Arka Plan
                <InfoTooltip message="Kare içinde boş kalan alanların rengini belirleyin." />
              </label>
              <div className="flex items-center gap-3">
                <Input
                  id="product-bg-input"
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
            <Button type="submit" disabled={loading || !hasToken || !selectedProductImage}>
              {loading ? 'Oluşturuluyor…' : 'Kare Görseli Oluştur'}
            </Button>
          </div>

          {previewUrl && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,260px)]">
              <div className="space-y-4 rounded-lg border border-muted/70 bg-muted/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Paylaşılabilir bağlantı</p>
                    <p className="text-xs text-muted-foreground">URL’yi e-ticaret ekipleriyle paylaşabilir veya kampanya araçlarınıza ekleyebilirsiniz.</p>
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
                  <p className="text-xs text-muted-foreground">Oluşturulan kare görseli kontrol edin ve dilediğiniz formatta indirin.</p>
                </div>
                {previewImageContainer}
              </div>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
