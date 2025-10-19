import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient, gql } from 'graphql-request';
import sharp from 'sharp';
import crypto from 'crypto';
import { JwtHelpers } from '@/helpers/jwt-helpers';

// --- CONFIG ---
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 5000;

const LIST_PRODUCTS_WITH_IMAGES = gql`
  query listProductsWithImages($id: String!, $page: Int = 1, $limit: Int = 1) {
    listProduct(id: { eq: $id }, pagination: { page: $page, limit: $limit }) {
      data {
        id
        variants {
          id
          images {
            imageId
            isMain
            order
          }
        }
      }
    }
  }
`;

// TODO: imageId -> gerçek URL çözümleyici
async function resolveImageUrlFromImageId(imageId: string): Promise<string | null> {
  // Ör: Eğer mağazanızda imageId -> URL pattern’i belliyse burada üretin:
  // return `https://cdn.myikas.com/media/${imageId}.jpg`;
  // Ya da dosyayı ikas’ın dosya servisinden çekiyorsanız burada fetch edin ve
  // kareleyiciye ham buffer verin (url yerine buffer ile çalışacak farklı akış kurulur).
  return null;
}

// --- Utilities (square pipeline ile aynı util'ler) ---
type SupportedFormat = 'jpeg' | 'webp' | 'avif' | 'png';
const clampNumber = (v: unknown, min: number, max: number, d: number) => {
  const x = Number(v ?? d); return Number.isNaN(x) ? d : Math.max(min, Math.min(max, x));
};
const pickFormat = (accept: string | null, forced: string | null): SupportedFormat => {
  const f = (forced ?? 'auto').toLowerCase();
  if (f !== 'auto') return (['png','webp','avif'].includes(f) ? f : 'jpeg') as SupportedFormat;
  if ((accept ?? '').includes('image/avif')) return 'avif';
  if ((accept ?? '').includes('image/webp')) return 'webp';
  return 'jpeg';
};
const normaliseHexColor = (s: string | null) => {
  const v = (s ?? 'ffffff').replace('#', '').toLowerCase();
  return /^[0-9a-f]{6}$/.test(v) ? `#${v}` : '#ffffff';
};
const gravityFromAlign = (a: string | null) => {
  const x = (a ?? 'center').toLowerCase();
  return x === 'top' ? sharp.gravity.north :
         x === 'bottom' ? sharp.gravity.south :
         x === 'left' ? sharp.gravity.west :
         x === 'right' ? sharp.gravity.east : sharp.gravity.center;
};
const createEtag = (b: Buffer) => `"${crypto.createHash('md5').update(b).digest('hex')}"`;

async function fetchImage(url: string, timeoutMs = IMAGE_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`fetch_${res.status}`);
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length > MAX_IMAGE_BYTES) throw new Error('too_big');
    const lastMod = res.headers.get('last-modified') ?? new Date().toUTCString();
    return { buf, lastMod };
  } finally {
    clearTimeout(t);
  }
}

// --- RUNTIME HINTS ---
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- MAIN ---
export async function GET(req: NextRequest) {
  try {
    // 1) JWT al & doğrula
    const auth = req.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : null;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = JwtHelpers.verifyToken(token);
    if (!payload?.sub || !payload?.aud) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // merchantId = payload.sub, authorizedAppId = payload.aud

    // 2) GraphQL client (Bearer: aynı JWT)
    const gqlClient = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPH_API_URL!, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 3) Parametreler
    const sp = new URL(req.url).searchParams;
    const productId = sp.get('productId');
    const index = clampNumber(sp.get('index'), 0, 50, 0);
    const size  = clampNumber(sp.get('size'), 128, 2048, 1024);
    const bg    = normaliseHexColor(sp.get('bg'));
    const align = sp.get('align');
    const format= pickFormat(req.headers.get('accept'), sp.get('format'));

    if (!productId) {
      return NextResponse.json({ error: 'missing_productId' }, { status: 400 });
    }

    // 4) Ürün -> ilk varyant -> imageId seç
    const data: any = await gqlClient.request(LIST_PRODUCTS_WITH_IMAGES, { id: productId, page: 1, limit: 1 });
    const product = data?.listProduct?.data?.[0];
    const variant = product?.variants?.[0];
    const images  = variant?.images ?? [];
    if (!images.length) return NextResponse.json({ error: 'no_images' }, { status: 404 });

    const i = Math.max(0, Math.min(index, images.length - 1));
    const imageId: string = images[i].imageId;

    // 5) imageId -> URL
    const srcUrl = await resolveImageUrlFromImageId(imageId);
    if (!srcUrl) {
      // Geçici: çözümleyici hazır değilse 501 (Not Implemented)
      return NextResponse.json({ error: 'image_url_resolver_missing' }, { status: 501 });
    }

    // 6) kareleme
    const { buf: inputBuffer, lastMod } = await fetchImage(srcUrl);

    let pipe = sharp(inputBuffer, { failOn: 'none' })
      .resize(size, size, { fit: 'contain', background: bg, position: gravityFromAlign(align) });

    let contentType: `image/${SupportedFormat}` = 'image/jpeg';
    switch (format) {
      case 'webp': pipe = pipe.webp({ quality: 80 }); contentType = 'image/webp'; break;
      case 'avif': pipe = pipe.avif({ quality: 55 }); contentType = 'image/avif'; break;
      case 'png':  pipe = pipe.png();                 contentType = 'image/png';  break;
      default:     pipe = pipe.jpeg({ quality: 88, mozjpeg: true }); contentType = 'image/jpeg';
    }

    const output = await pipe.toBuffer();
    const tag = createEtag(output);

    if (req.headers.get('if-none-match') === tag) {
      return new NextResponse(null, { status: 304 });
    }

    return new NextResponse(new Uint8Array(output), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        'ETag': tag,
        'Last-Modified': lastMod,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'internal_error' }, { status: 500 });
  }
}
