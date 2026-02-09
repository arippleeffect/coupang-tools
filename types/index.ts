export enum MESSAGE_TYPE {
  ROCKETGROSS_EXPORT_EXCEL = "ROCKETGROSS_EXPORT_EXCEL",
  VIEW_PRODUCT_METRICS = "VIEW_PRODUCT_METRICS",
  GET_PRODUCT = "GET_PRODUCT",
  EXCEL_DOWNLOAD_BANNER_INIT = "EXCEL_DOWNLOAD_BANNER_INIT",
  PCID_INIT = "PCID_INIT",
  LICENSE_CHECK = "LICENSE_CHECK",
  LICENSE_ACTIVATE = "LICENSE_ACTIVATE",
  LICENSE_DEACTIVATE = "LICENSE_DEACTIVATE",
  LICENSE_VALIDATE = "LICENSE_VALIDATE",
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

type ProductStatus = "LOADING" | "COMPLETE" | "FAIL" | "EMPTY";
export type ProductType = "NORMAL" | "AD";
export type OptionPriceInfo = {
  itemId: number;
  vendorItemId: number;
  salePrice: number;
  productUrl: string;
  optionName?: string;
};

export type PriceValidationResult = {
  hasPriceDifference: boolean;
  options: OptionPriceInfo[];
  lowestPrice: number;
  lowestItemId: number;
  apiPrice: number;
};

export type QuantityInfoPrice = {
  salePrice: string;
  i18nSalePrice?: { amount: string };
};

export type QuantityInfoItemInfo = {
  itemId: number;
  productId: number;
  vendorItemId: number;
};

export type QuantityInfoOptionItem = {
  itemId: number;
  vendorItemId: number;
  finalPrice: string;
  productUrl?: string;
  title?: string;
  itemName?: string;
  optionItemName?: string;
  itemBasicInfo?: { itemName?: string };
};

export type QuantityInfoDetailItem = {
  action?: {
    event?: { url?: string };
  };
  priceInfo?: {
    finalPrice: string;
    finalUnitPrice?: string;
  };
  itemBasicInfo?: {
    itemId?: number;
    itemName?: string;
    vendorItemId?: number;
  };
  stockInfo?: {
    soldOut?: boolean;
  };
  // fallback: top-level fields (일부 응답에서 itemBasicInfo 없이 제공)
  itemId?: number;
  vendorItemId?: number;
  productUrl?: string;
};

export type QuantityInfoResponse = {
  price: QuantityInfoPrice;
  moduleData?: {
    itemInfo?: QuantityInfoItemInfo;
    viewType?: string;
    optionList?: QuantityInfoOptionItem[];
    items?: QuantityInfoDetailItem[];
  }[];
};

type ProductData = {
  brandName: string;
  pv: number;
  sales: number;
  totalSales?: number;
  rate: string;
  priceValidation?: PriceValidationResult;
};
export type ProductState = {
  dataId: string;
  productName: string;
  productId: string;
  itemId: string;
  vendorItemId?: string;
  status: ProductStatus;
  type: ProductType;
  data?: ProductData;
};

export type CoupangProduct = {
  productId: number;
  productName: string;
  brandName: string;
  itemId: number;
  itemName: string;
  displayCategoryInfo: {
    leafCategoryCode: number;
    rootCategoryCode: number;
    categoryHierarchy: string;
  }[];
  manufacture: string;
  categoryId: number;
  itemCountOfProduct: number;
  imagePath: string;
  matchType: string | null;
  salePrice: number;
  vendorItemId: number;
  ratingCount: number;
  rating: number;
  sponsored: string | null;
  matchingResultId: string | null;
  pvLast28Day: number;
  salesLast28d: number;
  deliveryMethod: string;
  attributeTypes: string | null;
};

export type LicenseStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "INVALID";

export type LicenseInfo = {
  email: string;
  activationToken: string;
  status: LicenseStatus;
  activatedAt?: string;
};

export type LicenseActivateRequest = {
  email: string;
  licenseKey: string;
};

export type LicenseActivateResponse = {
  ok: boolean;
  license?: LicenseInfo;
  message?: string;
  error?: string;
};

export type LicenseDeactivateRequest = {
  activationToken: string;
};

export type LicenseDeactivateResponse = {
  ok: boolean;
  message?: string;
  error?: string;
};
