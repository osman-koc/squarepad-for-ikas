import { NextRequest, NextResponse } from 'next/server';

const PASS_THROUGH_PARAMS = ['size', 'bg', 'align', 'format', 'pad'] as const;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSquareUrl(origin: string, imageUrl: string, params: URLSearchParams): string {
  const url = new URL('/api/square/from-image-url', origin);
  url.searchParams.set('img', imageUrl);

  for (const param of PASS_THROUGH_PARAMS) {
    const value = params.get(param);
    if (value) {
      url.searchParams.set(param, value);
    }
  }

  return url.toString();
}

function replaceImageLinks(xml: string, origin: string, params: URLSearchParams): string {
  // First pass: replace <g:image_link> tags only
  // Use non-greedy match and ensure we don't cross into other tags
  const afterImageLink = xml.replace(
    /<g:image_link>([\s\S]*?)<\/g:image_link>/gi,
    (match, content: string) => {
      const transformed = transformImageUrl(content, origin, params);
      return `<g:image_link>${transformed}</g:image_link>`;
    }
  );

  // Second pass: replace <g:additional_image_link> tags only
  const afterAdditionalImageLink = afterImageLink.replace(
    /<g:additional_image_link>([\s\S]*?)<\/g:additional_image_link>/gi,
    (match, content: string) => {
      const transformed = transformImageUrl(content, origin, params);
      return `<g:additional_image_link>${transformed}</g:additional_image_link>`;
    }
  );

  return afterAdditionalImageLink;
}

function transformImageUrl(content: string, origin: string, params: URLSearchParams): string {
  const leadingWhitespace = content.match(/^\s*/)?.[0] ?? '';
  const trailingWhitespace = content.match(/\s*$/)?.[0] ?? '';
  const inner = content.slice(leadingWhitespace.length, content.length - trailingWhitespace.length);

  if (!inner) {
    return content;
  }

  let rawLink = inner;
  let useCdata = false;

  if (rawLink.startsWith('<![CDATA[') && rawLink.endsWith(']]>')) {
    rawLink = rawLink.slice(9, -3);
    useCdata = true;
  }

  const normalised = rawLink.trim();
  if (!normalised) {
    return content;
  }

  let transformed: string;
  try {
    transformed = buildSquareUrl(origin, normalised, params);
  } catch {
    return content;
  }

  const safeContent = useCdata ? `<![CDATA[${transformed}]]>` : escapeXml(transformed);
  return `${leadingWhitespace}${safeContent}${trailingWhitespace}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sourceUrl = searchParams.get('source');

  if (!sourceUrl) {
    return NextResponse.json({ error: 'missing_source' }, { status: 400 });
  }

  const origin = process.env.NEXT_PUBLIC_DEPLOY_URL || req.nextUrl.origin;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'source_unavailable' }, { status: 502 });
    }

    const xml = await response.text();
    const transformedXml = replaceImageLinks(xml, origin, searchParams);

    return new NextResponse(transformedXml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'failed_to_transform';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
