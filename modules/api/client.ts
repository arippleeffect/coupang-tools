import { MESSAGE_TYPE, type CoupangProduct } from "@/types";

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  data?: T;
}

/**
 * 백그라운드로 메시지 전송
 * @param message - 전송할 메시지
 * @returns API 응답
 */
async function sendMessage<T = any>(message: any): Promise<ApiResponse<T>> {
  return browser.runtime.sendMessage(message);
}

/**
 * 키워드로 상품 목록 조회
 * @param keyword - 검색 키워드
 * @returns 상품 목록
 */
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

/**
 * 단일 상품 정보 조회
 * @param itemId - 옵션 ID
 * @returns 상품 정보
 */
export async function fetchSingleProduct(
  itemId: string
): Promise<CoupangProduct> {
  const response = await sendMessage({
    type: MESSAGE_TYPE.GET_PRODUCT,
    keyword: itemId,
  });

  if (!response.ok) {
    throw response;
  }

  const result = (response.data?.result as CoupangProduct[]) || [];
  const matched = result.find((r) => String(r.itemId) === itemId);

  if (!matched) {
    throw {
      code: "EMPTY",
      message: `No product found for itemId=${itemId}`,
      error: `No product found for itemId=${itemId}`,
    };
  }

  return matched;
}

/**
 * 전환율 계산
 * @param pv - 페이지뷰
 * @param sales - 판매량
 * @returns 전환율 (백분율)
 */
export function calculateRate(pv?: number, sales?: number): string {
  if (pv && pv > 0 && sales !== undefined && isFinite(sales)) {
    return ((sales / pv) * 100).toFixed(2) + "%";
  }
  return "-";
}

/**
 * 총 매출액 계산
 * @param sales - 판매량
 * @param price - 가격
 * @returns 총 매출액
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
