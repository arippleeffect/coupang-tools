import { MESSAGE_TYPE, type CoupangProduct } from "@/types";

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
}

async function sendMessage<T = any>(message: any): Promise<ApiResponse<T>> {
  return browser.runtime.sendMessage(message);
}

export async function fetchProducts(
  keyword: string
): Promise<CoupangProduct[]> {
  const response = await sendMessage({
    type: MESSAGE_TYPE.GET_PRODUCT,
    keyword,
  });

  if (!response.ok) {
    throw response;
  }

  return (response.data?.result as CoupangProduct[]) || [];
}

export async function fetchSingleProduct(
  productId: string
): Promise<CoupangProduct> {
  const response = await sendMessage({
    type: MESSAGE_TYPE.GET_PRODUCT,
    keyword: productId,
  });

  if (!response.ok) {
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

export function calculateRate(pv?: number, sales?: number): string {
  if (pv && pv > 0 && sales !== undefined && isFinite(sales)) {
    return ((sales / pv) * 100).toFixed(2) + "%";
  }
  return "-";
}

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
