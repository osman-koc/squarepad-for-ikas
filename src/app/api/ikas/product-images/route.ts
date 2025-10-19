import { NextRequest, NextResponse } from 'next/server';
import { getImageSrc } from '@ikas/app-helpers';
import { getIkas } from '@/helpers/api-helpers';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { ProductImagesQueryData } from '@/lib/ikas-client/generated/graphql';

const PREVIEW_IMAGE_SIZE = 1080;

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const productId = request.nextUrl.searchParams.get('productId');
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) {
    return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });
  }

  try {
    const ikasClient = getIkas(authToken);
    const response = await ikasClient.queries.productImages({
      id: { eq: productId },
    });

    if (!response.isSuccess || !response.data?.listProduct?.data?.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = (response.data.listProduct as ProductImagesQueryData).data[0];

    const imageMap = new Map<
      string,
      {
        imageId: string;
        url: string;
        isMain: boolean;
        order: number;
        fileName?: string;
        variants: Array<{ id: string; sku: string | null }>;
      }
    >();

    for (const variant of product.variants ?? []) {
      for (const image of variant.images ?? []) {
        if (!image?.imageId) {
          continue;
        }

        const url = getImageSrc(PREVIEW_IMAGE_SIZE, user.merchantId, image.imageId);
        const key = image.imageId;

        if (!imageMap.has(key)) {
          imageMap.set(key, {
            imageId: image.imageId,
            url,
            isMain: image.isMain,
            order: image.order,
            fileName: image.fileName ?? undefined,
            variants: [{ id: variant.id, sku: variant.sku ?? null }],
          });
        } else {
          const entry = imageMap.get(key)!;
          entry.isMain = entry.isMain || image.isMain;
          entry.order = Math.min(entry.order, image.order);
          entry.variants.push({ id: variant.id, sku: variant.sku ?? null });
        }
      }
    }

    const images = Array.from(imageMap.values()).sort((a, b) => a.order - b.order);

    return NextResponse.json({
      data: {
        product: {
          id: product.id,
          name: product.name,
          images,
          variants: (product.variants ?? []).map((variant) => ({
            id: variant.id,
            sku: variant.sku ?? null,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch product images', error);
    return NextResponse.json({ error: 'Failed to fetch product images' }, { status: 500 });
  }
}
