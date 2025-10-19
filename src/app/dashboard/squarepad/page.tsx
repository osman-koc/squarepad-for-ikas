'use client';

import { AppBridgeHelper } from '@ikas/app-helpers';
import { Info } from 'lucide-react';
import Image from 'next/image';
import { flushSync } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TokenHelpers } from '@/helpers/token-helpers';
import { ApiRequests } from '@/lib/api-requests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const alignOptions = ['center', 'top', 'bottom', 'left', 'right'] as const;
type AlignOption = (typeof alignOptions)[number];

const formatOptions = ['auto', 'jpeg', 'png', 'webp', 'avif'] as const;
type FormatOption = (typeof formatOptions)[number];

type TabId = 'product' | 'image' | 'xml';

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

const InfoTooltip = ({ message }: { message: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => event.preventDefault()}
        aria-label={message}
      >
        <Info aria-hidden="true" className="h-3.5 w-3.5" focusable="false" />
      </button>
      {open ? (
        <span className="pointer-events-none absolute left-full top-0 z-20 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
          {message}
        </span>
      ) : null}
    </span>
  );
};

export default function SquarePadAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('xml');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopyState, setShareCopyState] = useState<'idle' | 'success' | 'error'>('idle');
  const shareCopyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentYear = new Date().getFullYear();

  const [productForm, setProductForm] = useState({
    productId: '',
    index: '1',
    size: '1024',
    bg: '#ffffff',
    align: 'center' as AlignOption,
    format: 'auto' as FormatOption,
  });
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productBgDraft, setProductBgDraft] = useState('#ffffff');

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

  useEffect(() => {
    AppBridgeHelper.closeLoader();
  }, []);

  useEffect(() => {
    TokenHelpers.getTokenForIframeApp()
      .then((resolvedToken) => {
        if (!resolvedToken) {
          setTokenError('Token alınamadı. Lütfen ikas üzerinden eriştiğinizden emin olun.');
          return;
        }
        setToken(resolvedToken);
        setTokenError(null);
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
    if (shareCopyResetTimer.current) {
      clearTimeout(shareCopyResetTimer.current);
      shareCopyResetTimer.current = null;
    }
    setShareCopyState('idle');
  }, [shareUrl]);

  useEffect(() => {
    return () => {
      if (shareCopyResetTimer.current) {
        clearTimeout(shareCopyResetTimer.current);
      }
    };
  }, []);

  const tabItems = useMemo(
    () =>
      [
        {
          id: 'xml' as TabId,
          label: 'XML Feed',
          description: 'Ürün feed’inizdeki ek görselleri kare versiyonlarıyla değiştirin.',
        },
        {
          id: 'image' as TabId,
          label: 'URL ile Görsel',
          description: 'Herhangi bir görsel bağlantısını kare formatına uyarlayın.',
        },
        {
          id: 'product' as TabId,
          label: 'Ürün ID ile Görsel',
          description: 'İkas kataloğundaki bir ürün görselini kare olarak hazırlayın.',
        },
      ],
    [],
  );

  const handleProductSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!token) {
        setProductError('Token alınamadı.');
        return;
      }

      if (!productForm.productId.trim()) {
        setProductError('Lütfen ürün ID bilgisini girin.');
        return;
      }

      setProductLoading(true);
      setProductError(null);

      try {
        const params: {
          productId: string;
          index?: number;
          size?: number;
          bg?: string;
          format?: string;
          align?: string;
        } = {
          productId: productForm.productId.trim(),
          align: productForm.align,
        };

        const indexValue = parseOptionalNumber(productForm.index);
        if (indexValue !== undefined) {
          params.index = indexValue;
        }

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

        const response = await ApiRequests.square.fromProductId(token, params);
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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlem sırasında hata oluştu.';
        setProductError(message);
      } finally {
        setProductLoading(false);
      }
    },
    [productForm, token],
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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'İşlem sırasında hata oluştu.';
        setImageError(message);
      } finally {
        setImageLoading(false);
      }
    },
    [imageForm, token],
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
        setShareUrl(null);
        return;
      }

      setXmlLoading(true);
      setXmlError(null);
      setShareUrl(null);

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

        setXmlPreview(response.data);

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

        setShareUrl(shareTarget.toString());
      } catch (error) {
        const message = error instanceof Error ? error.message : 'XML dönüştürme sırasında hata oluştu.';
        setXmlError(message);
        setXmlPreview('');
        setShareUrl(null);
      } finally {
        setXmlLoading(false);
      }
    },
    [token, xmlForm],
  );

  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) {
      return;
    }

    const scheduleReset = () => {
      if (shareCopyResetTimer.current) {
        clearTimeout(shareCopyResetTimer.current);
      }
      shareCopyResetTimer.current = setTimeout(() => {
        setShareCopyState('idle');
        shareCopyResetTimer.current = null;
      }, 2500);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
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
      setShareCopyState('success');
      scheduleReset();
    } catch {
      setShareCopyState('error');
      scheduleReset();
    }
  }, [shareUrl]);

  const copyButtonLabel = shareCopyState === 'success' ? 'Kopyalandı!' : shareCopyState === 'error' ? 'Tekrar Dene' : 'Kopyala';
  const copyButtonVariant = shareCopyState === 'success' ? 'default' : shareCopyState === 'error' ? 'destructive' : 'outline';
  const copyStatusMessage =
    shareCopyState === 'success'
      ? 'Bağlantı panoya kopyalandı.'
      : shareCopyState === 'error'
        ? 'Kopyalama başarısız oldu, lütfen tekrar deneyin.'
        : '';

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 pb-12 pt-10">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <Image alt="SquarePad Logo" className="h-12 w-12 rounded-xl border border-muted bg-card p-1 shadow-sm" height={48} width={48} src="/square-logo.svg" />
            <div>
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">SquarePad</span>
              <h1 className="text-2xl font-semibold text-foreground">Görsellerinizi Kare Formata Taşıyın</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Aşağıdaki araçlarla ürün görsellerinizi kare formatta yeniden boyutlandırabilir, hızlıca kontrol edip paylaşılabilir bağlantılar oluşturabilirsiniz.</p>
          {tokenError && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{tokenError}</p>}
        </header>

        <Card>
            <CardHeader>
              <CardTitle>Görsel Dönüştürme Seçenekleri</CardTitle>
              <CardDescription>İhtiyacınıza en uygun yöntemi seçerek kare görseller üretin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 rounded-xl border border-muted bg-muted/30 p-1">
              {tabItems.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  variant="ghost"
                  aria-pressed={activeTab === tab.id}
                  className={`min-w-[150px] flex-1 px-4 py-2 text-sm font-medium transition-colors duration-75 ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  onClick={() => {
                    if (activeTab !== tab.id) {
                      flushSync(() => {
                        setActiveTab(tab.id);
                      });
                    }
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">{tabItems.find((tab) => tab.id === activeTab)?.description}</p>
          </CardContent>
        </Card>

        {activeTab === 'product' && (
          <Card>
            <CardHeader>
              <CardTitle>Ürün Kimliği ile Kare Görsel</CardTitle>
              <CardDescription>İkas’ta kayıtlı bir ürünün görselini kare boyutlarda yeniden oluşturun. Görsel sırası ve çıktı seçenekleri isteğe bağlıdır.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleProductSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="product-id-input">
                      Ürün ID
                    </label>
                    <Input
                      id="product-id-input"
                      placeholder="örn. gid://ikas/Product/123"
                      value={productForm.productId}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, productId: event.target.value }))}
                      onInvalid={(event) => event.currentTarget.setCustomValidity('Lütfen ürün ID bilgisini girin.')}
                      onInput={(event) => event.currentTarget.setCustomValidity('')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="product-index-input">
                      Görsel Sırası
                      <InfoTooltip message="Ürünün görsel listesinden hangi sıranın kullanılacağını seçin. 1 ana görseli temsil eder." />
                    </label>
                    <Input
                      id="product-index-input"
                      type="number"
                      min={0}
                      value={productForm.index}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, index: event.target.value }))}
                    />
                  </div>
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
                      value={productForm.size}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, size: event.target.value }))}
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
                      value={productForm.align}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, align: event.target.value as AlignOption }))}
                    >
                      {alignOptions.map((align) => (
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
                      value={productForm.format}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, format: event.target.value as FormatOption }))}
                    >
                      {formatOptions.map((format) => (
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
                        value={productForm.bg}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setProductBgDraft(nextValue);
                          setProductForm((prev) => ({ ...prev, bg: nextValue }));
                        }}
                      />
                      <Input
                        aria-label="Arka plan hex"
                        className="max-w-[140px]"
                        value={productBgDraft.toUpperCase()}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/[^0-9A-Fa-f#]/g, '');
                          const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
                          const trimmed = withoutHash.slice(0, 6);
                          const withHash = `#${trimmed.toLowerCase()}`;
                          setProductBgDraft(withHash);
                          if (trimmed.length === 6) {
                            setProductForm((prev) => ({ ...prev, bg: withHash }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {productError && <p className="text-sm text-destructive">{productError}</p>}

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={productLoading || !token}>
                    {productLoading ? 'Oluşturuluyor…' : 'Kare Görseli Oluştur'}
                  </Button>
                  {productPreviewUrl && (
                    <a className="text-sm text-primary underline-offset-4 hover:underline" href={productPreviewUrl} download target="_blank" rel="noreferrer">
                      Önizlemeyi indir
                    </a>
                  )}
                </div>

                {productPreviewUrl && (
                  <div className="mt-6 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">Önizleme</span>
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-muted bg-muted/30 p-6">
                      <Image
                        alt="Ürün kare görseli"
                        className="h-64 w-64 rounded-md object-contain shadow-sm"
                        height={256}
                        width={256}
                        src={productPreviewUrl}
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'image' && (
          <Card>
            <CardHeader>
              <CardTitle>URL ile Kare Görsel</CardTitle>
              <CardDescription>Elinizdeki herhangi bir görsel bağlantısını kare ölçülere göre yeniden boyutlandırın.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleImageSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="image-url-input">
                      Görsel URL
                    </label>
                    <Input
                      id="image-url-input"
                      placeholder="https://cdn.ikas.com/media/product-image.jpg"
                      value={imageForm.img}
                      onChange={(event) => setImageForm((prev) => ({ ...prev, img: event.target.value }))}
                      onInvalid={(event) => event.currentTarget.setCustomValidity('Lütfen dönüştürülecek görsel URL’sini girin.')}
                      onInput={(event) => event.currentTarget.setCustomValidity('')}
                      required
                    />
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
                      value={imageForm.size}
                      onChange={(event) => setImageForm((prev) => ({ ...prev, size: event.target.value }))}
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
                      value={imageForm.align}
                      onChange={(event) => setImageForm((prev) => ({ ...prev, align: event.target.value as AlignOption }))}
                    >
                      {alignOptions.map((align) => (
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
                      value={imageForm.format}
                      onChange={(event) => setImageForm((prev) => ({ ...prev, format: event.target.value as FormatOption }))}
                    >
                      {formatOptions.map((format) => (
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
                        value={imageForm.bg}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setImageBgDraft(nextValue);
                          setImageForm((prev) => ({ ...prev, bg: nextValue }));
                        }}
                      />
                      <Input
                        aria-label="Arka plan hex"
                        className="max-w-[140px]"
                        value={imageBgDraft.toUpperCase()}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/[^0-9A-Fa-f#]/g, '');
                          const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
                          const trimmed = withoutHash.slice(0, 6);
                          const withHash = `#${trimmed.toLowerCase()}`;
                          setImageBgDraft(withHash);
                          if (trimmed.length === 6) {
                            setImageForm((prev) => ({ ...prev, bg: withHash }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {imageError && <p className="text-sm text-destructive">{imageError}</p>}

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={imageLoading || !token}>
                  {imageLoading ? 'Oluşturuluyor…' : 'Kare Görseli Oluştur'}
                  </Button>
                  {imagePreviewUrl && (
                    <a className="text-sm text-primary underline-offset-4 hover:underline" href={imagePreviewUrl} download target="_blank" rel="noreferrer">
                      Önizlemeyi indir
                    </a>
                  )}
                </div>

                {imagePreviewUrl && (
                  <div className="mt-6 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">Önizleme</span>
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-muted bg-muted/30 p-6">
                      <Image
                        alt="Kare görsel önizleme"
                        className="h-64 w-64 rounded-md object-contain shadow-sm"
                        height={256}
                        width={256}
                        src={imagePreviewUrl}
                        unoptimized
                      />
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}

        {activeTab === 'xml' && (
          <Card>
            <CardHeader>
              <CardTitle>XML Feed Dönüştürücü</CardTitle>
              <CardDescription>Mevcut ürün feed’inizdeki ek görsel bağlantılarını kare olarak güncelleyin. Kaynak XML URL’si zorunludur.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleXmlSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 space-y-2">
                    <label className="flex items-center gap-1 text-sm font-medium text-foreground" htmlFor="xml-source-input">
                      Kaynak XML URL&apos;si
                      <InfoTooltip message="Kare görsellerle güncellenecek ürün feed’inin adresini girin." />
                    </label>
                    <Input
                      id="xml-source-input"
                      placeholder="https://example.com/feed.xml"
                      value={xmlForm.source}
                      onChange={(event) => setXmlForm((prev) => ({ ...prev, source: event.target.value }))}
                      onInvalid={(event) => event.currentTarget.setCustomValidity('Lütfen kaynak XML URL’sini girin.')}
                      onInput={(event) => event.currentTarget.setCustomValidity('')}
                      required
                    />
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
                      value={xmlForm.size}
                      onChange={(event) => setXmlForm((prev) => ({ ...prev, size: event.target.value }))}
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
                      value={xmlForm.align}
                      onChange={(event) => setXmlForm((prev) => ({ ...prev, align: event.target.value as AlignOption }))}
                    >
                      {alignOptions.map((align) => (
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
                      value={xmlForm.format}
                      onChange={(event) => setXmlForm((prev) => ({ ...prev, format: event.target.value as FormatOption }))}
                    >
                      {formatOptions.map((format) => (
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
                        value={xmlForm.bg}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setXmlBgDraft(nextValue);
                          setXmlForm((prev) => ({ ...prev, bg: nextValue }));
                        }}
                      />
                      <Input
                        aria-label="Arka plan hex"
                        className="max-w-[140px]"
                        value={xmlBgDraft.toUpperCase()}
                        onChange={(event) => {
                          const raw = event.target.value.replace(/[^0-9A-Fa-f#]/g, '');
                          const withoutHash = raw.startsWith('#') ? raw.slice(1) : raw;
                          const trimmed = withoutHash.slice(0, 6);
                          const withHash = `#${trimmed.toLowerCase()}`;
                          setXmlBgDraft(withHash);
                          if (trimmed.length === 6) {
                            setXmlForm((prev) => ({ ...prev, bg: withHash }));
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {xmlError && <p className="text-sm text-destructive">{xmlError}</p>}

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={xmlLoading || !token}>
                    {xmlLoading ? 'Dönüştürülüyor…' : 'XML Feed’i Güncelle'}
                  </Button>
                </div>

                {shareUrl && (
                  <div className="mt-6 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">Paylaşılabilir Bağlantı</span>
                    <div className="rounded-md border border-muted bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
                      <p className="break-all leading-relaxed">{shareUrl}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Button type="button" className="shrink-0" variant={copyButtonVariant} size="sm" onClick={handleCopyShareUrl}>
                          {copyButtonLabel}
                        </Button>
                        <span aria-live="polite" className="text-[11px] text-muted-foreground">
                          {copyStatusMessage}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {xmlPreview && (
                  <div className="mt-6 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">Önizleme</span>
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
                        {xmlPreview
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
                )}
              </form>
            </CardContent>
          </Card>
        )}
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
    </div>
  );
}
