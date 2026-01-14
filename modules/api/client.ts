/**
 * API Client
 *
 * Centralized API communication with retry logic
 */

import { MESSAGE_TYPE, type CoupangProduct } from "@/types";

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
}

/**
 * Send message to background script
 */
async function sendMessage<T = any>(message: any): Promise<ApiResponse<T>> {
  return browser.runtime.sendMessage(message);
}

/**
 * Fetch products by keyword
 */
export async function fetchProducts(
  keyword: string
): Promise<CoupangProduct[]> {
  const response = await sendMessage({
    type: MESSAGE_TYPE.GET_PRODUCT,
    keyword,
  });

  if (!response.ok) {
    // Throw the entire response to preserve code and other properties
    throw response;
  }

  return (response.data?.result as CoupangProduct[]) || [];
}

/**
 * Fetch single product by productId
 */
export async function fetchSingleProduct(
  productId: string
): Promise<CoupangProduct> {
  console.log("fetchSingleProduct");
  const response = await sendMessage({
    type: MESSAGE_TYPE.GET_PRODUCT,
    keyword: productId,
  });

  if (!response.ok) {
    // Throw the entire response to preserve code and other properties
    throw response;
  }

  const result = (response.data?.result as CoupangProduct[]) || [];
  const matched = result.find((r) => String(r.productId) === productId);

  if (!matched) {
    throw {
      code: "EMPTY",
      message: `No product found for productId=${productId}`,
      error: `No product found for productId=${productId}`,
    };
  }

  return matched;
}

/**
 * Calculate conversion rate
 */
export function calculateRate(pv?: number, sales?: number): string {
  if (pv && pv > 0 && sales !== undefined && isFinite(sales)) {
    return ((sales / pv) * 100).toFixed(2) + "%";
  }
  return "-";
}

/**
 * Calculate total sales
 */
export function calculateTotalSales(
  sales?: number,
  price?: number
): number | undefined {
  if (
    typeof sales === "number" &&
    typeof price === "number" &&
    isFinite(sales) &&
    isFinite(price)
  ) {
    return sales * price;
  }
  return undefined;
}
