import type { QuantityInfoResponse } from "@/types";

/**
 * 쿠팡 quantity-info API 호출 (Content Script에서 same-origin 직접 호출)
 * @param productId - 상품 ID
 * @param vendorItemId - 벤더 아이템 ID
 * @returns quantity-info 응답
 */
export async function fetchQuantityInfo(
  productId: string,
  vendorItemId: string,
): Promise<QuantityInfoResponse> {
  const url = `https://www.coupang.com/next-api/products/quantity-info?productId=${productId}&vendorItemId=${vendorItemId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      accept: "application/json, text/plain, */*",
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`quantity-info API failed: ${res.status}`);
  }

  const json = await res.json();

  // 응답이 배열인 경우 첫 번째 요소 반환
  if (Array.isArray(json)) {
    if (json.length === 0) {
      throw new Error("quantity-info returned empty array");
    }
    return json[0] as QuantityInfoResponse;
  }

  return json as QuantityInfoResponse;
}
