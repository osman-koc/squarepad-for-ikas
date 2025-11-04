'use client';

import { AppBridgeHelper } from '@ikas/app-helpers';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { TokenHelpers } from '@/helpers/token-helpers';
import { ApiRequests } from '@/lib/api-requests';
import { SquarePadHeader } from '@/components/squarepad/squarepad-header';
import { SquarePadTabSwitcher } from '@/components/squarepad/tab-switcher';
import { ProductTab } from '@/components/squarepad/product-tab';
import { ImageTab } from '@/components/squarepad/image-tab';
import { XmlTab } from '@/components/squarepad/xml-tab';
import { ProductSelectionDialog } from '@/components/squarepad/product-selection-dialog';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import type { AlignOption, FormatOption, ProductImageOption, ProductSummary, TabId } from '@/types/squarepad';
import type { CopyFeedback } from '@/types/ui';

const parseOptionalNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normaliseBgInput = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
};

export default function SquarePadAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('xml');

  const [xmlShareUrl, setXmlShareUrl] = useState<string | null>(null);
  const [xmlCopyState, setXmlCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const xmlCopyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [imageShareUrl, setImageShareUrl] = useState<string | null>(null);
  const [imageCopyState, setImageCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const imageCopyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [productShareUrl, setProductShareUrl] = useState<string | null>(null);
  const [productCopyState, setProductCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const productCopyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentYear = new Date().getFullYear();

  const [productForm, setProductForm] = useState({
    size: '1024',
    bg: '#ffffff',
    align: 'center' as AlignOption,
    format: 'auto' as FormatOption,
  });
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productBgDraft, setProductBgDraft] = useState('#ffffff');
  const [productSelectionOpen, setProductSelectionOpen] = useState(false);
  const [productListLoading, setProductListLoading] = useState(false);
  const [productListError, setProductListError] = useState<string | null>(null);
  const [productListData, setProductListData] = useState<ProductSummary[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productImagesCache, setProductImagesCache] = useState<Record<string, ProductImageOption[]>>({});
  const [productImagesLoadingId, setProductImagesLoadingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [selectedProductImage, setSelectedProductImage] = useState<ProductImageOption | null>(null);
  const productSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSearchRef = useRef(false);
  const selectedProductImages = useMemo(
    () => (selectedProduct ? productImagesCache[selectedProduct.id] ?? [] : []),
    [productImagesCache, selectedProduct],
  );

  const [imageForm, setImageForm] = useState({
    img: '',
    size: '1024',
    bg: '#ffffff',
    align: 'center' as AlignOption,
    format: 'auto' as FormatOption,
  });
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageBgDraft, setImageBgDraft] = useState('#ffffff');

  const [xmlForm, setXmlForm] = useState({
    source: '',
    size: '1024',
    bg: '#ffffff',
    align: 'center' as AlignOption,
    format: 'auto' as FormatOption,
  });
  const [xmlBgDraft, setXmlBgDraft] = useState('#ffffff');
  const [xmlPreview, setXmlPreview] = useState<string>('');
  const [xmlLoading, setXmlLoading] = useState(false);
  const [xmlError, setXmlError] = useState<string | null>(null);
  const [xmlProductCount, setXmlProductCount] = useState(0);

  useEffect(() => {
    AppBridgeHelper.closeLoader();
  }, []);

  useEffect(() => {
    TokenHelpers.getTokenForIframeApp()
      .then((resolvedToken) => {
        if (resolvedToken) {
          setToken(resolvedToken);
          setTokenError(null);
          return;
        }

        // If no token, try to authorize
        const urlParams = new URLSearchParams(window.location.search);
        const storeName = urlParams.get('storeName');
        if (storeName) {
          window.location.replace(`/api/oauth/authorize/ikas?storeName=${storeName}`);
        } else {
          setTokenError('Token alınamadı ve mağaza adı bulunamadı. Lütfen ikas üzerinden eriştiğinizden emin olun.');
        }
      })
      .catch((error) => {
        setTokenError(error instanceof Error ? error.message : 'Token alınırken bir hata oluştu.');
      });
  }, []);

  useEffect(() => {
    return () => {
      if (productPreviewUrl) {
        URL.revokeObjectURL(productPreviewUrl);
      }
    };
  }, [productPreviewUrl]);

  useEffect(() => {
    setProductBgDraft(productForm.bg);
  }, [productForm.bg]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    setImageBgDraft(imageForm.bg);
  }, [imageForm.bg]);

  useEffect(() => {
    setXmlBgDraft(xmlForm.bg);
  }, [xmlForm.bg]);

  useEffect(() => {
    if (xmlCopyResetTimer.current) {
      clearTimeout(xmlCopyResetTimer.current);
      xmlCopyResetTimer.current = null;
    }
    setXmlCopyState('idle');
  }, [xmlShareUrl]);

  useEffect(() => {
    if (imageCopyResetTimer.current) {
      clearTimeout(imageCopyResetTimer.current);
      imageCopyResetTimer.current = null;
    }
    setImageCopyState('idle');
  }, [imageShareUrl]);

  useEffect(() => {
    if (productCopyResetTimer.current) {
      clearTimeout(productCopyResetTimer.current);
      productCopyResetTimer.current = null;
    }
    setProductCopyState('idle');
  }, [productShareUrl]);

  useEffect(() => {
    if (!selectedProduct) {
      setSelectedProductImage(null);
      return;
    }

    const images = selectedProductImages;
    if (!images.length) {
      setSelectedProductImage(null);
      return;
    }

    const hasExisting = selectedProductImage && images.some((image) => image.imageId === selectedProductImage.imageId);
    if (!hasExisting) {
      setSelectedProductImage(images[0]);
    }
  }, [selectedProduct, selectedProductImage, selectedProductImages]);

  useEffect(() => {
    return () => {
      if (xmlCopyResetTimer.current) {
        clearTimeout(xmlCopyResetTimer.current);
      }
      if (imageCopyResetTimer.current) {
        clearTimeout(imageCopyResetTimer.current);
      }
      if (productCopyResetTimer.current) {
        clearTimeout(productCopyResetTimer.current);
      }
    };
  }, []);

  const fetchProductList = useCallback(
    async (searchTerm: string) => {
      if (!token) {
        setProductError('Token alınamadı.');
        return;
      }

      setProductListLoading(true);
      setProductListError(null);

      const trimmed = searchTerm.trim();
      const params: {
        page: number;
        limit: number;
        search?: string;
      } = {
        page: 1,
        limit: 50,
      };

      if (trimmed) {
        params.search = trimmed;
      }

      try {
        const response = await ApiRequests.ikas.listProducts(token, params);
        if (response.status !== 200 || !response.data?.data) {
          throw new Error('Ürün listesi alınamadı.');
        }

        const items = response.data.data.items.map((item) => ({
          id: item.id,
          name: item.name,
          variants: item.variants ?? [],
        }));

        setProductListData(items);
        setProductImagesCache((prev) => {
          if (!items.length) {
            return {};
          }
          const retained: Record<string, ProductImageOption[]> = {};
          for (const item of items) {
            if (prev[item.id]) {
              retained[item.id] = prev[item.id];
            }
          }
          return retained;
        });

        if (selectedProduct && !items.some((item) => item.id === selectedProduct.id)) {
          setSelectedProduct(null);
          setSelectedProductImage(null);
          setProductShareUrl(null);
          setProductPreviewUrl((prev) => {
            if (prev) {
              URL.revokeObjectURL(prev);
            }
            return null;
          });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ürün listesi alınırken hata oluştu.';
        setProductListError(message);
        setProductListData([]);
      } finally {
        setProductListLoading(false);
      }
    },
    [selectedProduct, token],
  );

  useEffect(() => {
    if (!productSelectionOpen) {
      if (productSearchTimerRef.current) {
        clearTimeout(productSearchTimerRef.current);
        productSearchTimerRef.current = null;
      }
      skipNextSearchRef.current = false;
      setProductListError(null);
      setProductListLoading(false);
      setProductSearchQuery('');
      return;
    }

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (productSearchTimerRef.current) {
      clearTimeout(productSearchTimerRef.current);
    }

    productSearchTimerRef.current = setTimeout(() => {
      void fetchProductList(productSearchQuery.trim());
    }, 400);

    return () => {
      if (productSearchTimerRef.current) {
        clearTimeout(productSearchTimerRef.current);
        productSearchTimerRef.current = null;
      }
    };
  }, [fetchProductList, productSearchQuery, productSelectionOpen]);

  const ensureProductImages = useCallback(
    async (productId: string): Promise<ProductImageOption[]> => {
      const cached = productImagesCache[productId];
      if (cached && cached.length) {
        return cached;
      }

      if (!token) {
        setProductError('Token alınamadı.');
        return [];
      }

      setProductImagesLoadingId(productId);
      setProductListError(null);

      try {
        const response = await ApiRequests.ikas.getProductImages(token, productId);
        if (response.status !== 200 || !response.data?.data?.product) {
          throw new Error('Ürün görselleri alınamadı.');
        }

        const images = response.data.data.product.images ?? [];
        setProductImagesCache((prev) => ({ ...prev, [productId]: images }));
        return images;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ürün görselleri alınırken hata oluştu.';
        setProductListError(message);
        return [];
      } finally {
        setProductImagesLoadingId(null);
      }
    },
    [productImagesCache, token],
  );

  const handleOpenProductSelection = useCallback(() => {
    if (!token) {
      setProductError('Token alınamadı.');
      return;
    }

    skipNextSearchRef.current = true;
    setProductSelectionOpen(true);
    setProductListError(null);
    setProductListData([]);
    setProductSearchQuery('');
    void fetchProductList('');
  }, [fetchProductList, token]);

  const filteredProducts = useMemo(() => {
    const query = productSearchQuery.trim().toLowerCase();
    if (!query) {
      return productListData;
    }
    return productListData.filter((product) => {
      if (product.name.toLowerCase().includes(query) || product.id.toLowerCase().includes(query)) {
        return true;
      }
      return product.variants.some((variant) => (variant.sku ?? '').toLowerCase().includes(query));
    });
  }, [productListData, productSearchQuery]);

  const handleSelectProductImage = useCallback((image: ProductImageOption) => {
    setSelectedProductImage(image);
    setProductShareUrl(null);
    setProductPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setProductError(null);
  }, []);

  const handleSelectProduct = useCallback(
    (product: ProductSummary) => {
      setSelectedProduct(product);
      setProductError(null);
      setProductShareUrl(null);
      setProductPreviewUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return null;
      });

      const cached = productImagesCache[product.id];
      if (cached && cached.length) {
        handleSelectProductImage(cached[0]);
        return;
      }

      void ensureProductImages(product.id).then((images) => {
        if (images.length) {
          handleSelectProductImage(images[0]);
        } else {
          setSelectedProductImage(null);
        }
      });
    },
    [ensureProductImages, handleSelectProductImage, productImagesCache],
  );

  const handleConfirmProductSelection = useCallback(() => {
    if (!selectedProductImage) {
      return;
    }
    setProductError(null);
    setProductSelectionOpen(false);
  }, [selectedProductImage]);

  const handleProductFormUpdate = useCallback((changes: Partial<typeof productForm>) => {
    setProductForm((prev) => ({ ...prev, ...changes }));
  }, []);

  const handleProductBgDraftChange = useCallback((value: string) => {
    setProductBgDraft(value);
  }, []);

  const handleClearProductSelection = useCallback(() => {
    setSelectedProduct(null);
    setSelectedProductImage(null);
    setProductShareUrl(null);
    setProductPreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  }, []);

  const handleImageFormUpdate = useCallback((changes: Partial<typeof imageForm>) => {
    setImageForm((prev) => ({ ...prev, ...changes }));
  }, []);

  const handleImageBgDraftChange = useCallback((value: string) => {
    setImageBgDraft(value);
  }, []);

  const handleXmlFormUpdate = useCallback((changes: Partial<typeof xmlForm>) => {
    setXmlForm((prev) => ({ ...prev, ...changes }));
  }, []);

  const handleXmlBgDraftChange = useCallback((value: string) => {
    setXmlBgDraft(value);
  }, []);

  const handleProductSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) {
        setProductError('Token alınamadı.');
        return;
      }

      if (!selectedProduct || !selectedProductImage) {
        setProductError('Lütfen katalogdan ürün ve görsel seçin.');
        return;
      }

      setProductLoading(true);
      setProductError(null);
      setProductShareUrl(null);

      try {
        const params: {
          img: string;
          size?: number;
          bg?: string;
          format?: string;
          align?: string;
        } = {
          img: selectedProductImage.url,
          align: productForm.align,
        };

        const sizeValue = parseOptionalNumber(productForm.size);
        if (sizeValue !== undefined) {
          params.size = sizeValue;
        }

        const bgValue = normaliseBgInput(productForm.bg);
        if (bgValue) {
          params.bg = bgValue;
        }

        if (productForm.format !== 'auto') {
          params.format = productForm.format;
        }

        const response = await ApiRequests.square.fromImageUrl(token, params);
        if (response.status !== 200) {
          throw new Error('Görsel alınamadı.');
        }

        const blob = response.data;
        const nextUrl = URL.createObjectURL(blob);
        setProductPreviewUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return nextUrl;
        });

        if (typeof window !== 'undefined') {
          const shareTarget = new URL('/api/square/from-image-url', window.location.origin);
          const shareParams = new URLSearchParams();
          shareParams.set('img', selectedProductImage.url);
          if (params.size) {
            shareParams.set('size', params.size.toString());
          }
          if (params.bg) {
            shareParams.set('bg', params.bg);
          }
          if (params.format) {
            shareParams.set('format', params.format);
          }
          if (params.align) {
            shareParams.set('align', params.align);
          }
          shareTarget.search = shareParams.toString();
          setProductShareUrl(shareTarget.toString());
        } else {
          setProductShareUrl(selectedProductImage.url);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlem sırasında hata oluştu.';
        setProductError(message);
        setProductShareUrl(null);
      } finally {
        setProductLoading(false);
      }
    },
    [productForm.align, productForm.bg, productForm.format, productForm.size, selectedProduct, selectedProductImage, token],
  );

  const handleImageSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) {
        setImageError('Token alınamadı.');
        return;
      }

      if (!imageForm.img.trim()) {
        setImageError('Lütfen dönüştürülecek görsel URL’sini girin.');
        return;
      }

      setImageLoading(true);
      setImageError(null);
      setImageShareUrl(null);

      try {
        const params: {
          img: string;
          size?: number;
          bg?: string;
          format?: string;
          align?: string;
        } = {
          img: imageForm.img.trim(),
          align: imageForm.align,
        };

        const sizeValue = parseOptionalNumber(imageForm.size);
        if (sizeValue !== undefined) {
          params.size = sizeValue;
        }

        const bgValue = normaliseBgInput(imageForm.bg);
        if (bgValue) {
          params.bg = bgValue;
        }

        if (imageForm.format !== 'auto') {
          params.format = imageForm.format;
        }

        const response = await ApiRequests.square.fromImageUrl(token, params);
        if (response.status !== 200) {
          throw new Error('Görsel alınamadı.');
        }

        const blob = response.data;
        const nextUrl = URL.createObjectURL(blob);
        setImagePreviewUrl((prev) => {
          if (prev) {
            URL.revokeObjectURL(prev);
          }
          return nextUrl;
        });

        if (typeof window !== 'undefined') {
          const shareTarget = new URL('/api/square/from-image-url', window.location.origin);
          const shareParams = new URLSearchParams();
          shareParams.set('img', params.img);
          if (params.size) {
            shareParams.set('size', params.size.toString());
          }
          if (params.bg) {
            shareParams.set('bg', params.bg);
          }
          if (params.format) {
            shareParams.set('format', params.format);
          }
          if (params.align) {
            shareParams.set('align', params.align);
          }
          shareTarget.search = shareParams.toString();
          setImageShareUrl(shareTarget.toString());
        } else {
          setImageShareUrl(params.img);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlem sırasında hata oluştu.';
        setImageError(message);
        setImageShareUrl(null);
      } finally {
        setImageLoading(false);
      }
    },
    [imageForm.align, imageForm.bg, imageForm.format, imageForm.img, imageForm.size, token],
  );

  const handleXmlSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) {
        setXmlError('Token alınamadı.');
        return;
      }

      const trimmedSourceInput = xmlForm.source.trim();
      if (!trimmedSourceInput) {
        setXmlError('Lütfen kaynak XML URL’sini girin.');
        setXmlShareUrl(null);
        setXmlProductCount(0);
        return;
      }

      setXmlLoading(true);
      setXmlError(null);
      setXmlShareUrl(null);
      setXmlProductCount(0);

      try {
        const params: {
          source?: string;
          size?: number;
          bg?: string;
          format?: string;
          align?: string;
        } = {
          align: xmlForm.align,
        };

        params.source = trimmedSourceInput;

        const sizeValue = parseOptionalNumber(xmlForm.size);
        if (sizeValue !== undefined) {
          params.size = sizeValue;
        }

        const bgValue = normaliseBgInput(xmlForm.bg);
        if (bgValue) {
          params.bg = bgValue;
        }

        if (xmlForm.format !== 'auto') {
          params.format = xmlForm.format;
        }

        const response = await ApiRequests.square.fromXmlUrl(token, params);
        if (response.status !== 200) {
          throw new Error('XML feed alınamadı.');
        }

        const xml = response.data;
        const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
        const groupIds = new Set();
        let simpleProducts = 0;
        for (const block of itemBlocks) {
          const groupIdMatch = block.match(/<g:item_group_id>([\s\S]*?)<\/g:item_group_id>/);
          if (groupIdMatch && groupIdMatch[1]) {
            groupIds.add(groupIdMatch[1]);
          } else {
            simpleProducts++;
          }
        }
        const productCount = groupIds.size + simpleProducts;
        setXmlProductCount(productCount);
        setXmlPreview(xml);

        const shareTarget = new URL('/api/square/from-xml-url', window.location.origin);
        const shareParams = new URLSearchParams();

        const resolvedSource = params.source ?? trimmedSourceInput;
        if (resolvedSource) {
          shareParams.set('source', resolvedSource);
        }
        if (params.size) {
          shareParams.set('size', params.size.toString());
        }
        if (params.bg) {
          shareParams.set('bg', params.bg);
        }
        if (params.format) {
          shareParams.set('format', params.format);
        }
        if (params.align) {
          shareParams.set('align', params.align);
        }

        const shareQuery = shareParams.toString();
        if (shareQuery) {
          shareTarget.search = shareQuery;
        }

        setXmlShareUrl(shareTarget.toString());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'XML dönüştürme sırasında hata oluştu.';
        setXmlError(message);
        setXmlPreview('');
        setXmlShareUrl(null);
        setXmlProductCount(0);
      } finally {
        setXmlLoading(false);
      }
    },
    [token, xmlForm.align, xmlForm.bg, xmlForm.format, xmlForm.size, xmlForm.source],
  );

  const copyToClipboard = useCallback(
    async (
      value: string | null,
      timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>,
      setState: Dispatch<SetStateAction<'idle' | 'success' | 'error'>>,
    ) => {
      if (!value) {
        return;
      }

      const scheduleReset = () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          setState('idle');
          timerRef.current = null;
        }, 2500);
      };

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = value;
          textarea.style.position = 'fixed';
          textarea.style.top = '-9999px';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const successful = document.execCommand('copy');
          document.body.removeChild(textarea);
          if (!successful) {
            throw new Error('copy_failed');
          }
        }
        setState('success');
        scheduleReset();
      } catch {
        setState('error');
        scheduleReset();
      }
    },
    [],
  );

  const handleXmlCopyShareUrl = useCallback(async () => {
    await copyToClipboard(xmlShareUrl, xmlCopyResetTimer, setXmlCopyState);
  }, [copyToClipboard, xmlShareUrl]);

  const handleImageCopyShareUrl = useCallback(async () => {
    await copyToClipboard(imageShareUrl, imageCopyResetTimer, setImageCopyState);
  }, [copyToClipboard, imageShareUrl]);

  const handleProductCopyShareUrl = useCallback(async () => {
    await copyToClipboard(productShareUrl, productCopyResetTimer, setProductCopyState);
  }, [copyToClipboard, productShareUrl]);

  const getCopyPresentation = useCallback((state: 'idle' | 'success' | 'error'): CopyFeedback => {
    const label = state === 'success' ? 'Kopyalandı!' : state === 'error' ? 'Tekrar Dene' : 'Kopyala';
    const variant: CopyFeedback['variant'] = state === 'success' ? 'default' : state === 'error' ? 'destructive' : 'outline';
    const message =
      state === 'success'
        ? 'Bağlantı panoya kopyalandı.'
        : state === 'error'
          ? 'Kopyalama başarısız oldu, lütfen tekrar deneyin.'
          : '';
    return { label, variant, message };
  }, []);

  const xmlCopyPresentation = useMemo(() => getCopyPresentation(xmlCopyState), [getCopyPresentation, xmlCopyState]);
  const imageCopyPresentation = useMemo(() => getCopyPresentation(imageCopyState), [getCopyPresentation, imageCopyState]);
  const productCopyPresentation = useMemo(() => getCopyPresentation(productCopyState), [getCopyPresentation, productCopyState]);

  const tabItems = useMemo(
    () =>
      [
        { id: 'xml' as TabId },
        { id: 'product' as TabId },
        { id: 'image' as TabId },
      ],
    [],
  );  const productCardImagesLoading = useMemo(() => (selectedProduct ? productImagesLoadingId === selectedProduct.id : false), [productImagesLoadingId, selectedProduct]);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      if (tab === activeTab) {
        return;
      }
      flushSync(() => {
        setActiveTab(tab);
      });
    },
    [activeTab],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 pb-12 pt-10">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <SquarePadHeader tokenError={tokenError} />
        <SquarePadTabSwitcher tabs={tabItems} activeTab={activeTab} onTabChange={handleTabChange} />
        {activeTab === 'product' ? (
          <ProductTab
            hasToken={Boolean(token)}
            form={productForm}
            bgDraft={productBgDraft}
            onFormUpdate={handleProductFormUpdate}
            onBgDraftChange={handleProductBgDraftChange}
            onOpenSelection={handleOpenProductSelection}
            onClearSelection={handleClearProductSelection}
            onSubmit={handleProductSubmit}
            listLoading={productListLoading}
            listError={productListError}
            selectedProduct={selectedProduct}
            selectedProductImage={selectedProductImage}
            selectedProductImages={selectedProductImages}
            productImagesLoading={productCardImagesLoading}
            loading={productLoading}
            error={productError}
            previewUrl={productPreviewUrl}
            shareUrl={productShareUrl}
            onCopyShareUrl={handleProductCopyShareUrl}
            copyPresentation={productCopyPresentation}
            onSelectProductImage={handleSelectProductImage}
          />
        ) : null}
        {activeTab === 'image' ? (
          <ImageTab
            hasToken={Boolean(token)}
            form={imageForm}
            bgDraft={imageBgDraft}
            onFormUpdate={handleImageFormUpdate}
            onBgDraftChange={handleImageBgDraftChange}
            onSubmit={handleImageSubmit}
            loading={imageLoading}
            error={imageError}
            previewUrl={imagePreviewUrl}
            shareUrl={imageShareUrl}
            onCopyShareUrl={handleImageCopyShareUrl}
            copyPresentation={imageCopyPresentation}
          />
        ) : null}
        {activeTab === 'xml' ? (
          <XmlTab
            hasToken={Boolean(token)}
            form={xmlForm}
            bgDraft={xmlBgDraft}
            onFormUpdate={handleXmlFormUpdate}
            onBgDraftChange={handleXmlBgDraftChange}
            onSubmit={handleXmlSubmit}
            loading={xmlLoading}
            error={xmlError}
            shareUrl={xmlShareUrl}
            preview={xmlPreview}
            productCount={xmlProductCount}
            onCopyShareUrl={handleXmlCopyShareUrl}
            copyPresentation={xmlCopyPresentation}
          />
        ) : null}
      </div>
      <footer className="border-t border-muted bg-background">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span className="tracking-wide">&copy; {currentYear} SquarePad</span>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <span>Developed by</span>
            <a className="font-medium text-foreground transition hover:text-primary" href="https://osmankoc.dev" rel="noopener noreferrer" target="_blank">
              Osman Koç
            </a>
            <span className="hidden text-muted-foreground sm:inline" aria-hidden="true">
              •
            </span>
            <a className="text-foreground transition hover:text-primary" href="mailto:me@osmankoc.dev">
              me@osmankoc.dev
            </a>
          </div>
        </div>
      </footer>
      <ProductSelectionDialog
        open={productSelectionOpen}
        onOpenChange={setProductSelectionOpen}
        loading={productListLoading}
        error={productListError}
        searchQuery={productSearchQuery}
        onSearchChange={setProductSearchQuery}
        products={filteredProducts}
        imagesByProduct={productImagesCache}
        selectedProduct={selectedProduct}
        selectedProductImage={selectedProductImage}
        productImagesLoadingId={productImagesLoadingId}
        onSelectProduct={handleSelectProduct}
        onSelectProductImage={handleSelectProductImage}
        onConfirmSelection={handleConfirmProductSelection}
      />
    </div>
  );
}
