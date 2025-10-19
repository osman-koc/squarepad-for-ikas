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

export const LIST_PRODUCTS = gql`
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

export const GET_PRODUCT_IMAGES = gql`
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
