import { gql } from 'graphql-request';

export const GET_MERCHANT = gql`
  query getMerchant {
    getMerchant {
      id
      email
      storeName
    }
  }
`;

export const GET_AUTHORIZED_APP = gql`
  query getAuthorizedApp {
    getAuthorizedApp {
      id
      salesChannelId
    }
  }
`;

export const LIST_PRODUCTS_WITH_IMAGES = gql`
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
