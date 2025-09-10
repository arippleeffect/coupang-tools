export enum MESSAGE_TYPE {
  ROCKETGROSS_EXPORT_EXCEL = "ROCKETGROSS_EXPORT_EXCEL",
  VIEW_PRODUCT_METRICS = "VIEW_PRODUCT_METRICS",
  GET_PRODUCT = "GET_PRODUCT",
  EXCEL_DOWNLOAD_BANNER_INIT = "EXCEL_DOWNLOAD_BANNER_INIT",
}

export type GetProductMetricsMsg = {
  type: string;
  productIds?: string[];
  productId?: string | number;
};

export type GetProductMsg = {
  type: string;
  keyword: string | number;
};

export type PreMatchingSearchResponse = {
  nextSearchPage: number;
  result: {
    attributeTypes: string | null;
    brandName: string | null;
    categoryId: number;
    deliveryMethod: string;
    displayCategoryInfo: {
      categoryHierarchy: string;
      leafCategoryCode: number;
      rootCategoryCode: number;
    }[];
    imagePath: string;
    itemCountOfProduct: number;
    itemId: number;
    itemName: string;
    manufacture: string;
    matchType: string | null;
    matchingResultId: null;
    productId: number;
    productName: string;
    pvLast28Day: number;
    rating: number;
    ratingCount: number;
    salePrice: number;
    salesLast28d: number;
    sponsored: null;
    vendorItemId: number;
  }[];
  hasNext: true;
};

export enum COUPANG_COOKIE_KEY {
  XSRF_TOKEN = "XSRF-TOKEN",
}

export type MessageResponse<T> = {
  ok: boolean;
  status?: number;
  data?: T;
  error?: string;
  message?: string;
};
