export type AlignOption = 'center' | 'top' | 'bottom' | 'left' | 'right';

export type FormatOption = 'auto' | 'jpeg' | 'png' | 'webp' | 'avif';

export type TabId = 'product' | 'image' | 'xml';

export type ProductVariantSummary = {
  id: string;
  sku: string | null;
};

export type ProductImageOption = {
  imageId: string;
  url: string;
  isMain: boolean;
  order: number;
  fileName?: string;
  variants: ProductVariantSummary[];
};

export type ProductSummary = {
  id: string;
  name: string;
  variants: ProductVariantSummary[];
};
