import { NextRequest, NextResponse } from 'next/server';

const PASS_THROUGH_PARAMS = ['size', 'bg', 'align', 'format'] as const;

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

function replaceAdditionalImageLinks(xml: string, origin: string, params: URLSearchParams): string {
  const regex = /(<g:additional_image_link[^>]*>)([\s\S]*?)(<\/g:additional_image_link>)/gi;

  return xml.replace(regex, (match, openTag: string, content: string, closeTag: string) => {
    const leadingWhitespace = content.match(/^\s*/)?.[0] ?? '';
    const trailingWhitespace = content.match(/\s*$/)?.[0] ?? '';
    const inner = content.slice(leadingWhitespace.length, content.length - trailingWhitespace.length);

    if (!inner) {
      return match;
    }

    let rawLink = inner;
    let useCdata = false;

    if (rawLink.startsWith('<![CDATA[') && rawLink.endsWith(']]>')) {
      rawLink = rawLink.slice(9, -3);
      useCdata = true;
    }

    const normalised = rawLink.trim();
    if (!normalised) {
      return match;
    }

    let transformed: string;
    try {
      transformed = buildSquareUrl(origin, normalised, params);
    } catch {
      return match;
    }

    const safeContent = useCdata ? `<![CDATA[${transformed}]]>` : escapeXml(transformed);
    const replacedContent = `${leadingWhitespace}${safeContent}${trailingWhitespace}`;
    return `${openTag}${replacedContent}${closeTag}`;
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sourceUrl = searchParams.get('source');

  if (!sourceUrl) {
    return NextResponse.json({ error: 'missing_source' }, { status: 400 });
  }

  const origin = req.nextUrl.origin;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'source_unavailable' }, { status: 502 });
    }

    const xml = await response.text();
    const transformedXml = replaceAdditionalImageLinks(xml, origin, searchParams);

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
