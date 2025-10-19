import axios from 'axios';
import { GetMerchantApiResponse } from '../app/api/ikas/get-merchant/route';
import { ApiResponseType } from '../globals/constants';

export async function makePostRequest<T>({ url, data, token }: { url: string; data?: any; token?: string }) {
  return axios.post<ApiResponseType<T>>(url, data, {
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

export async function makeGetRequest<T>({ url, data, token }: { url: string; data?: any; token?: string }) {
  return axios.get<ApiResponseType<T>>(url, {
    params: data,
    headers: token
      ? {
          Authorization: `JWT ${token}`,
        }
      : undefined,
  });
}

// API requests object - frontend-backend bridge
export const ApiRequests = {
  ikas: {
    getMerchant: (token: string) => makeGetRequest<GetMerchantApiResponse>({ url: '/api/ikas/get-merchant', token }),
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
      }),
  },
};
