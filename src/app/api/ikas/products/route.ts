import { NextRequest, NextResponse } from 'next/server';
import { getIkas } from '@/helpers/api-helpers';
import { getUserFromRequest } from '@/lib/auth-helpers';
import { AuthTokenManager } from '@/models/auth-token/manager';
import { ListProductsQueryData, ListProductsQueryVariables } from '@/lib/ikas-client/generated/graphql';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function normalisePage(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

function normaliseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const authToken = await AuthTokenManager.get(user.authorizedAppId);
  if (!authToken) {
    return NextResponse.json({ error: 'Auth token not found' }, { status: 404 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = normalisePage(searchParams.get('page'));
  const limit = normaliseLimit(searchParams.get('limit'));
  const search = searchParams.get('search')?.trim();
  const sku = searchParams.get('sku')?.trim();

  const variables: ListProductsQueryVariables = {
    pagination: {
      page,
      limit,
    },
    search: search ? search : undefined,
    sku: sku ? { eq: sku } : undefined,
  };

  try {
    const ikasClient = getIkas(authToken);
    const response = await ikasClient.queries.listProducts(variables);

    if (!response.isSuccess || !response.data?.listProduct) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 502 });
    }

    const list: ListProductsQueryData = response.data.listProduct as ListProductsQueryData;
    const items = list.data.map((item) => ({
      id: item.id,
      name: item.name,
      variants: item.variants?.map((variant) => ({
        id: variant.id,
        sku: variant.sku ?? null,
      })) ?? [],
    }));

    return NextResponse.json({
      data: {
        items,
        pagination: {
          page: list.page,
          limit: list.limit,
          count: list.count,
          hasNext: list.hasNext,
        },
      },
    });
  } catch (error) {
    console.error('Failed to list products', error);
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 });
  }
}
