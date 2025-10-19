import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const DEFAULT_SIZE = envNumber('SQUARE_DEFAULT_SIZE', 1024);
const MAX_SIZE = envNumber('SQUARE_MAX_SIZE', 2048);
const MAX_INPUT_MB = envNumber('SQUARE_MAX_INPUT_MB', 15);

const MAX_IMAGE_BYTES = MAX_INPUT_MB * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 5000;
const MIN_SIZE = 128;

type SupportedFormat = 'jpeg' | 'webp' | 'avif' | 'png';

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const numericValue = Number(value ?? fallback);
  if (Number.isNaN(numericValue)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, numericValue));
}

function pickFormat(acceptHeader: string | null, forcedFormat: string | null): SupportedFormat {
  const requested = (forcedFormat ?? 'auto').toLowerCase();
  if (requested !== 'auto') {
    if (requested === 'png' || requested === 'webp' || requested === 'avif') {
      return requested;
    }
    return 'jpeg';
  }

  const accept = acceptHeader ?? '';
  if (accept.includes('image/avif')) {
    return 'avif';
  }
  if (accept.includes('image/webp')) {
    return 'webp';
  }
  return 'jpeg';
}

function normaliseHexColor(input: string | null): string {
  const value = (input ?? 'ffffff').replace('#', '').toLowerCase();
  return /^[0-9a-f]{6}$/.test(value) ? `#${value}` : '#ffffff';
}

function gravityFromAlign(align: string | null): typeof sharp.gravity.center {
  const alignment = (align ?? 'center').toLowerCase();
  if (alignment === 'top') {
    return sharp.gravity.north;
  }
  if (alignment === 'bottom') {
    return sharp.gravity.south;
  }
  if (alignment === 'left') {
    return sharp.gravity.west;
  }
  if (alignment === 'right') {
    return sharp.gravity.east;
  }
  return sharp.gravity.center;
}

function createEtag(buffer: Buffer): string {
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  return `"${hash}"`;
}

async function fetchImage(
  url: string,
  timeoutMs: number = IMAGE_TIMEOUT_MS,
): Promise<{ buffer: Buffer; lastModified: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`fetch_${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error('too_big');
    }

    const lastModified = response.headers.get('last-modified') ?? new Date().toUTCString();
    return { buffer, lastModified };
  } finally {
    clearTimeout(timeout);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = new URL(req.url).searchParams;
    const imageParam = searchParams.get('img');
    if (!imageParam) {
      return NextResponse.json({ error: 'missing_img' }, { status: 400 });
    }

    const size = clampNumber(searchParams.get('size'), MIN_SIZE, MAX_SIZE, DEFAULT_SIZE);
    const background = normaliseHexColor(searchParams.get('bg'));
    const align = searchParams.get('align');
    const format = pickFormat(req.headers.get('accept'), searchParams.get('format'));
    const sourceUrl = decodeURIComponent(imageParam);

    const { buffer: inputBuffer, lastModified } = await fetchImage(sourceUrl);

    let pipeline = sharp(inputBuffer, { failOn: 'none' }).resize(size, size, {
      fit: 'contain',
      background,
      position: gravityFromAlign(align),
    });

    let contentType: `image/${SupportedFormat}` = 'image/jpeg';
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality: 80 });
        contentType = 'image/webp';
        break;
      case 'avif':
        pipeline = pipeline.avif({ quality: 55 });
        contentType = 'image/avif';
        break;
      case 'png':
        pipeline = pipeline.png();
        contentType = 'image/png';
        break;
      default:
        pipeline = pipeline.jpeg({ quality: 88, mozjpeg: true });
        contentType = 'image/jpeg';
    }

    const output = await pipeline.toBuffer();
    const tag = createEtag(output);

    if (req.headers.get('if-none-match') === tag) {
      return new NextResponse(null, { status: 304 });
    }

    const body = new Uint8Array(output);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
        ETag: tag,
        'Last-Modified': lastModified,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'internal_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
