import { BaseGraphQLAPIClient, BaseGraphQLAPIClientOptions, APIResult } from '@ikas/admin-api-client';



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

export type ListProductsWithImagesQueryVariables = {
  page?: number;
  limit?: number;
}

export type ListProductsWithImagesQueryData = {
  data: Array<{
  id: string;
  name: string;
  variants: Array<{
  id: string;
  images?: Array<{
  imageId?: string;
  isMain: boolean;
  order: number;
}>;
}>;
}>;
  page: number;
  limit: number;
  hasNext: boolean;
  count: number;
}

export interface ListProductsWithImagesQuery {
  listProduct: ListProductsWithImagesQueryData;
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

  async listProductsWithImages(variables: ListProductsWithImagesQueryVariables): Promise<APIResult<Partial<ListProductsWithImagesQuery>>> {
    const query = `
  query listProductsWithImages($page: Int = 1, $limit: Int = 1) {
    listProduct(pagination: { page: $page, limit: $limit }) {
      data {
        id
        name
        variants {
          id
          images {
            imageId
            isMain
            order
          }
        }
      }
      page
      limit
      hasNext
      count
    }
  }
`;
    return this.client.query<Partial<ListProductsWithImagesQuery>>({ query, variables });
  }
}

export class ikasAdminGraphQLAPIClient<TokenData> extends BaseGraphQLAPIClient<TokenData> {
  queries: GeneratedQueries;

  constructor(options: BaseGraphQLAPIClientOptions<TokenData>) {
    super(options);
    this.queries = new GeneratedQueries(this);
  }
}
