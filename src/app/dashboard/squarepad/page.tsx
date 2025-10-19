'use client';

import { useCallback, useEffect, useState } from 'react';
import { TokenHelpers } from '@/helpers/token-helpers';
import { ApiRequests } from '@/lib/api-requests';

export default function SquarePadDemo() {
  const [token, setToken] = useState<string | null>(null);
  const [productId, setProductId] = useState('');
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // iframe içindeyken AppBridge’ten JWT al
    TokenHelpers.getTokenForIframeApp().then(setToken);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!token || !productId) return;
    setLoading(true);
    // backend endpoint’ini tetikle (görseli direkt döndürüyor)
    const res = await ApiRequests.square.fromProductId(token, { productId, size: 1024 });
    if (res.status === 200) {
      // binary döner: blob → object URL
      const blob = new Blob([res.data as any], { type: res.headers['content-type'] ?? 'image/jpeg' });
      const url = URL.createObjectURL(blob);
      setImgUrl(url);
    } else {
      console.error(await res.data);
    }
    setLoading(false);
  }, [token, productId]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">SquarePad Demo</h1>
      <input
        className="border p-2 w-full"
        placeholder="productId (örn. gid://ikas/Product/123)"
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
      />
      <button
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
        onClick={handleGenerate}
        disabled={!token || !productId || loading}
      >
        {loading ? 'Oluşturuyor…' : 'Kare Görseli Al'}
      </button>

      {imgUrl && (
        <div className="mt-4">
          <img src={imgUrl} alt="square" style={{ width: 256, height: 256, objectFit: 'contain' }} />
        </div>
      )}
    </div>
  );
}
