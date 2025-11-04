'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ProductImageOption, ProductSummary } from '@/types/squarepad';

type ProductSelectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  products: ProductSummary[];
  imagesByProduct: Record<string, ProductImageOption[]>;
  selectedProduct: ProductSummary | null;
  selectedProductImage: ProductImageOption | null;
  productImagesLoadingId: string | null;
  onSelectProduct: (product: ProductSummary) => void;
  onSelectProductImage: (image: ProductImageOption) => void;
  onConfirmSelection: () => void;
};

export function ProductSelectionDialog({
  open,
  onOpenChange,
  loading,
  error,
  searchQuery,
  onSearchChange,
  products,
  imagesByProduct,
  selectedProduct,
  selectedProductImage,
  productImagesLoadingId,
  onSelectProduct,
  onSelectProductImage,
  onConfirmSelection,
}: ProductSelectionDialogProps) {
  const t = useTranslations('squarepad.productDialog');
  const tCommon = useTranslations('common');
  const selectedProductId = selectedProduct?.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            disabled={loading}
          />

          <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
            {loading ? (
              <p className="text-sm text-muted-foreground">{t('loading')}</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('noProducts')}</p>
            ) : (
              products.map((product) => {
                const isSelected = selectedProductId === product.id;
                const productImages = imagesByProduct[product.id] ?? [];
                const isImagesLoading = productImagesLoadingId === product.id;
                const sku = product.variants.find((variant) => variant.sku)?.sku ?? t('skuUnknown');
                const imageCountLabel = isImagesLoading ? t('imagesLoading') : productImages.length ? t('imageCount').replace('{count}', productImages.length.toString()) : t('imagesWillLoad');

                return (
                  <div
                    key={product.id}
                    className={`rounded-lg border transition ${isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted bg-background hover:border-primary/40'}`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 p-3 text-left"
                      onClick={() => onSelectProduct(product)}
                    >
                      <div>
                        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
                        <p className="text-xs text-muted-foreground">{t('sku')}: {sku}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{imageCountLabel}</span>
                    </button>

                    {isSelected ? (
                      <div className="border-t border-muted/60 px-3 pb-3">
                        {isImagesLoading ? (
                          <p className="mt-3 text-[11px] text-muted-foreground">{t('imagesLoading')}</p>
                        ) : productImages.length > 0 ? (
                          <>
                            <p className="mt-3 text-[11px] text-muted-foreground">{t('selectImage')}</p>
                            <div className="mt-2 flex flex-wrap gap-3">
                              {productImages.map((image, index) => {
                                const isActive = selectedProductImage?.imageId === image.imageId;
                                return (
                                  <button
                                    type="button"
                                    key={`${product.id}-${image.imageId}`}
                                    onClick={() => onSelectProductImage(image)}
                                    className={`group relative flex w-28 flex-col items-center gap-2 rounded-md border p-2 transition ${
                                      isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-muted bg-background hover:border-primary/50'
                                    }`}
                                  >
                                    <Image
                                      alt={image.isMain ? t('mainImage') : t('imageIndex').replace('{index}', (index + 1).toString())}
                                      className="h-16 w-full rounded object-contain"
                                      height={64}
                                      width={96}
                                      src={image.url}
                                      unoptimized
                                    />
                                    <span className="text-[10px] text-muted-foreground">{image.isMain ? t('mainImage') : t('imageIndex').replace('{index}', (index + 1).toString())}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <p className="mt-3 text-[11px] text-muted-foreground">{t('noImages')}</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" onClick={onConfirmSelection} disabled={!selectedProductImage}>
            {t('confirmSelection')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
