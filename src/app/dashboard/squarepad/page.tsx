'use client';

import { AppBridgeHelper } from '@ikas/app-helpers';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
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

export default function SquarePadAdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('xml');
  const [iframeBaseUrl, setIframeBaseUrl] = useState<string>('');

  const [productForm, setProductForm] = useState({
    productId: '',
    index: '',
    size: '1024',
    bg: '#ffffff',
    align: 'center' as AlignOption,
    format: 'auto' as FormatOption,
  });
  const [productPreviewUrl, setProductPreviewUrl] = useState<string | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

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
    if (typeof window !== 'undefined') {
      setIframeBaseUrl(`${window.location.origin}/api/square`);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (productPreviewUrl) {
        URL.revokeObjectURL(productPreviewUrl);
      }
    };
  }, [productPreviewUrl]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    setXmlBgDraft(xmlForm.bg);
  }, [xmlForm.bg]);

  const tabItems = useMemo(
    () =>
      [
        {
          id: 'xml' as TabId,
          label: 'XML Feed',
          description: 'XML feed içindeki ek görsel linklerini kare URL’lerle günceller.',
        },
        {
          id: 'image' as TabId,
          label: 'URL ile Görsel',
          description: 'İstediğiniz görsel URL’sini kare formatına dönüştürür.',
        },
        {
          id: 'product' as TabId,
          label: 'Ürün ID ile Görsel',
          description: 'Bir ürünün görsellerinden kare versiyon üretir.',
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

      setXmlLoading(true);
      setXmlError(null);

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

        if (xmlForm.source.trim()) {
          params.source = xmlForm.source.trim();
        }

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
      } catch (error) {
        const message = error instanceof Error ? error.message : 'XML dönüştürme sırasında hata oluştu.';
        setXmlError(message);
        setXmlPreview('');
      } finally {
        setXmlLoading(false);
      }
    },
    [token, xmlForm],
  );

  return (
    <div className="min-h-screen bg-background pb-12 pt-10 text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Square Görsel Araçları</h1>
          <p className="text-sm text-muted-foreground">
            Bu panelden Square eklentinizin sağladığı kare görsel servislerini test edebilir ve müşterilerinizle paylaşacağınız URL&apos;leri doğrulayabilirsiniz.
          </p>
          {tokenError && <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{tokenError}</p>}
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Servisler</CardTitle>
            <CardDescription>Üç farklı kare görsel akışını tek ekrandan yönetin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {tabItems.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={activeTab === tab.id}
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
              <CardTitle>Ürün ID&apos;den Kare Görsel</CardTitle>
              <CardDescription>İlk varyantın görselini kare formatında üretir. Varsayılan feed ayarları için değer girmeniz gerekmez.</CardDescription>
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="product-index-input">
                      Görsel Sırası
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
                    <label className="text-sm font-medium text-foreground" htmlFor="product-size-input">
                      Çıktı Boyutu (px)
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
                    <label className="text-sm font-medium text-foreground" htmlFor="product-align-select">
                      Yerleşim
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
                    <label className="text-sm font-medium text-foreground" htmlFor="product-format-select">
                      Format
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
                    <label className="text-sm font-medium text-foreground" htmlFor="product-bg-input">
                      Arka Plan
                    </label>
                    <Input
                      id="product-bg-input"
                      type="color"
                      value={productForm.bg}
                      onChange={(event) => setProductForm((prev) => ({ ...prev, bg: event.target.value }))}
                    />
                  </div>
                </div>

                {productError && <p className="text-sm text-destructive">{productError}</p>}

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={productLoading || !token}>
                    {productLoading ? 'Oluşturuluyor…' : 'Kare Görseli Getir'}
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
              <CardTitle>URL&apos;den Kare Görsel</CardTitle>
              <CardDescription>Mevcut bir görsel URL’sini kare formatına dönüştürür.</CardDescription>
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="image-size-input">
                      Çıktı Boyutu (px)
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
                    <label className="text-sm font-medium text-foreground" htmlFor="image-align-select">
                      Yerleşim
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
                    <label className="text-sm font-medium text-foreground" htmlFor="image-format-select">
                      Format
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
                    <label className="text-sm font-medium text-foreground" htmlFor="image-bg-input">
                      Arka Plan
                    </label>
                    <Input
                      id="image-bg-input"
                      type="color"
                      value={imageForm.bg}
                      onChange={(event) => setImageForm((prev) => ({ ...prev, bg: event.target.value }))}
                    />
                  </div>
                </div>

                {imageError && <p className="text-sm text-destructive">{imageError}</p>}

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={imageLoading || !token}>
                    {imageLoading ? 'Oluşturuluyor…' : 'Kare Görseli Dönüştür'}
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
              <CardDescription>
                &lt;g:additional_image_link&gt; girdilerini Square servisinden dönen kare görsellerle değiştirir. Varsayılan feed URL&apos;sini kullanmak için kaynak boş bırakabilirsiniz.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleXmlSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="xml-source-input">
                      Kaynak XML URL&apos;si
                    </label>
                    <Input
                      id="xml-source-input"
                      placeholder="Boş bırakılırsa varsayılan feed kullanılır."
                      value={xmlForm.source}
                      onChange={(event) => setXmlForm((prev) => ({ ...prev, source: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="xml-size-input">
                      Çıktı Boyutu (px)
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
                    <label className="text-sm font-medium text-foreground" htmlFor="xml-align-select">
                      Yerleşim
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
                    <label className="text-sm font-medium text-foreground" htmlFor="xml-format-select">
                      Format
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
                    <label className="text-sm font-medium text-foreground" htmlFor="xml-bg-input">
                      Arka Plan
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
                    {xmlLoading ? 'Dönüştürülüyor…' : 'XML Feed Oluştur'}
                  </Button>
                  {iframeBaseUrl && (
                    <span className="text-xs text-muted-foreground">
                      Paylaşılabilir temel URL: <code className="rounded bg-muted px-2 py-1">{`${iframeBaseUrl}/from-xml-url`}</code>
                    </span>
                  )}
                </div>

                {xmlPreview && (
                  <div className="mt-6 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground">Önizleme</span>
                    <pre className="max-h-96 overflow-auto rounded-lg border border-muted bg-muted/20 p-4 text-xs text-foreground/80">
                      {xmlPreview}
                    </pre>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
