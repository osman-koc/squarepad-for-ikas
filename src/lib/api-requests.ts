import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { GetMerchantApiResponse } from '../app/api/ikas/get-merchant/route';
import { ApiResponseType } from '../globals/constants';

type RequestHeaders = { Authorization?: string };

type BaseRequestParams = {
  url: string;
  data?: unknown;
  token?: string;
};

type GetRequestParams<TResponse> = BaseRequestParams & {
  responseType?: AxiosRequestConfig['responseType'];
};

export async function makePostRequest<T>({ url, data, token }: { url: string; data?: unknown; token?: string }) {
  const headers: RequestHeaders | undefined = token ? { Authorization: `JWT ${token}` } : undefined;
  return axios.post<ApiResponseType<T>>(url, data, {
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

export async function makeGetRequest<T>({ url, data, token, responseType }: GetRequestParams<T>): Promise<AxiosResponse<T>> {
  const headers: RequestHeaders | undefined = token ? { Authorization: `JWT ${token}` } : undefined;

  return axios.get<T>(url, {
    params: data,
    headers,
    responseType,
  });
}

// API requests object - frontend-backend bridge
export const ApiRequests = {
  ikas: {
    getMerchant: (token: string) =>
      makeGetRequest<ApiResponseType<GetMerchantApiResponse>>({
        url: '/api/ikas/get-merchant',
        token,
      }),
  },

  square: {
    /**
     * Ürün ID'den kare görsel oluşturur (backend: /api/square/from-product-id)
     */
    fromProductId: (
      token: string,
      params: {
        productId: string;
        index?: number;
        size?: number;
        bg?: string;
        format?: string;
        align?: string;
      }
    ) =>
      makeGetRequest<Blob>({
        url: '/api/square/from-product-id',
        data: params,
        token,
        responseType: 'blob',
      }),

    /**
     * Görsel URL'den kare oluşturur (backend: /api/square/from-image-url)
     */
    fromImageUrl: (
      token: string,
      params: {
        img: string;
        size?: number;
        bg?: string;
        format?: string;
        align?: string;
      }
    ) =>
      makeGetRequest<Blob>({
        url: '/api/square/from-image-url',
        data: params,
        token,
        responseType: 'blob',
      }),

    /**
     * XML feed içinde yer alan görselleri kare URL'lerle günceller (backend: /api/square/from-xml-url)
     */
    fromXmlUrl: (
      token: string,
      params: {
        source?: string;
        size?: number;
        bg?: string;
        align?: string;
        format?: string;
      } = {},
    ) =>
      makeGetRequest<string>({
        url: '/api/square/from-xml-url',
        data: params,
        token,
        responseType: 'text',
      }),
  },
};
