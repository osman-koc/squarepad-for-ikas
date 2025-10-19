import { BaseGraphQLAPIClient, BaseGraphQLAPIClientOptions, APIResult } from '@ikas/admin-api-client';

export type PaginationInput = {
  limit?: number;
  page?: number;
}

export type StringFilterInput = {
  eq?: string;
  in?: Array<string>;
  ne?: string;
  nin?: Array<string>;
}

export type GetMerchantQueryVariables = {}

export type GetMerchantQueryData = {
  id: string;
  email: string;
  storeName?: string;
}

export interface GetMerchantQuery {
  getMerchant: GetMerchantQueryData;
}

export type GetAuthorizedAppQueryVariables = {}

export type GetAuthorizedAppQueryData = {
  id: string;
  salesChannelId?: string;
}

export interface GetAuthorizedAppQuery {
  getAuthorizedApp: GetAuthorizedAppQueryData;
}

export type ListProductsQueryVariables = {
  pagination?: PaginationInput;
  search?: string;
  sku?: StringFilterInput;
}

export type ListProductsQueryData = {
  data: Array<{
  id: string;
  name: string;
  variants: Array<{
  id: string;
  sku?: string;
}>;
}>;
  page: number;
  limit: number;
  hasNext: boolean;
  count: number;
}

export interface ListProductsQuery {
  listProduct: ListProductsQueryData;
}

export type ProductImagesQueryVariables = {
  id: StringFilterInput;
}

export type ProductImagesQueryData = {
  data: Array<{
  id: string;
  name: string;
  variants: Array<{
  id: string;
  sku?: string;
  images?: Array<{
  imageId?: string;
  fileName?: string;
  isMain: boolean;
  order: number;
}>;
}>;
}>;
}

export interface ProductImagesQuery {
  listProduct: ProductImagesQueryData;
}

export class GeneratedQueries {
  client: BaseGraphQLAPIClient<any>;

  constructor(client: BaseGraphQLAPIClient<any>) {
    this.client = client;
  }

  async getMerchant(): Promise<APIResult<Partial<GetMerchantQuery>>> {
    const query = `
  query getMerchant {
    getMerchant {
      id
      email
      storeName
    }
  }
`;
    return this.client.query<Partial<GetMerchantQuery>>({ query });
  }

  async getAuthorizedApp(): Promise<APIResult<Partial<GetAuthorizedAppQuery>>> {
    const query = `
  query getAuthorizedApp {
    getAuthorizedApp {
      id
      salesChannelId
    }
  }
`;
    return this.client.query<Partial<GetAuthorizedAppQuery>>({ query });
  }

  async listProducts(variables: ListProductsQueryVariables): Promise<APIResult<Partial<ListProductsQuery>>> {
    const query = `
  query ListProducts($pagination: PaginationInput, $search: String, $sku: StringFilterInput) {
    listProduct(pagination: $pagination, search: $search, sku: $sku, sort: "updatedAt:desc") {
      data {
        id
        name
        variants {
          id
          sku
        }
      }
      page
      limit
      hasNext
      count
    }
  }
`;
    return this.client.query<Partial<ListProductsQuery>>({ query, variables });
  }

  async productImages(variables: ProductImagesQueryVariables): Promise<APIResult<Partial<ProductImagesQuery>>> {
    const query = `
  query ProductImages($id: StringFilterInput!) {
    listProduct(id: $id, pagination: { page: 1, limit: 1 }) {
      data {
        id
        name
        variants {
          id
          sku
          images {
            imageId
            fileName
            isMain
            order
          }
        }
      }
    }
  }
`;
    return this.client.query<Partial<ProductImagesQuery>>({ query, variables });
  }
}

export class ikasAdminGraphQLAPIClient<TokenData> extends BaseGraphQLAPIClient<TokenData> {
  queries: GeneratedQueries;

  constructor(options: BaseGraphQLAPIClientOptions<TokenData>) {
    super(options);
    this.queries = new GeneratedQueries(this);
  }
}
