import { fetchQuantityInfo } from "@/modules/api/quantity-info";
import type { OptionPriceInfo, PriceValidationResult } from "@/types";

/**
 * quantity-info API를 호출하여 옵션별 가격 차이를 검증
 * @param productId - 상품 ID
 * @param vendorItemId - 벤더 아이템 ID
 * @param apiPrice - 쿠팡윙 API에서 받은 salePrice
 * @returns 가격 검증 결과 또는 null (검증 불가 시)
 */
export async function validateOptionPrices(
  productId: string,
  vendorItemId: string,
  apiPrice: number,
): Promise<PriceValidationResult | null> {
  try {
    const info = await fetchQuantityInfo(productId, vendorItemId);

    const options: OptionPriceInfo[] = [];

    // moduleData에서 items(PRODUCT_DETAIL_OPTION_LIST) 우선, 없으면 optionList 사용
    if (info.moduleData) {
      for (const mod of info.moduleData) {
        // items (PRODUCT_DETAIL_OPTION_LIST) - 세분화된 옵션 데이터 우선
        if (mod.items && mod.items.length > 0) {
          for (const item of mod.items) {
            // soldOut 옵션 제외
            if (item.stockInfo?.soldOut) continue;

            const price = parsePriceString(item.priceInfo?.finalPrice);
            if (price == null) continue;

            // itemBasicInfo 우선, 없으면 top-level fallback
            const itemId = item.itemBasicInfo?.itemId ?? item.itemId;
            const vendorItemId = item.itemBasicInfo?.vendorItemId ?? item.vendorItemId;
            if (itemId == null || vendorItemId == null) continue;

            // action.event.url에서 productUrl 구성
            let productUrl = "";
            const actionUrl = item.action?.event?.url;
            if (actionUrl) {
              if (actionUrl.startsWith("/")) {
                productUrl = `https://www.coupang.com${actionUrl}`;
              } else {
                productUrl = `https://www.coupang.com/${actionUrl}`;
              }
            } else if (item.productUrl) {
              productUrl = item.productUrl;
            } else {
              productUrl = buildProductUrl(productId, String(itemId), String(vendorItemId));
            }

            options.push({
              itemId,
              vendorItemId,
              salePrice: price,
              productUrl,
              optionName: item.itemBasicInfo?.itemName,
            });
          }
        }
      }

      // items에서 옵션을 못 찾은 경우 optionList fallback
      if (options.length === 0) {
        for (const mod of info.moduleData) {
          if (mod.optionList && mod.optionList.length > 0) {
            for (const opt of mod.optionList) {
              const price = parsePriceString(opt.finalPrice);
              if (price == null) continue;
              options.push({
                itemId: opt.itemId,
                vendorItemId: opt.vendorItemId,
                salePrice: price,
                productUrl: buildProductUrl(
                  productId,
                  String(opt.itemId),
                  String(opt.vendorItemId),
                ),
                optionName: opt.optionItemName || opt.itemBasicInfo?.itemName || opt.title || opt.itemName,
              });
            }
          }
        }
      }
    }

    // 옵션이 2개 미만이면 비교 불가
    if (options.length < 2) return null;

    // 옵션 간 가격 차이 확인
    const prices = new Set(options.map((o) => o.salePrice));
    const hasPriceDifference = prices.size > 1;

    if (!hasPriceDifference) return null;

    const lowestOption = options.reduce((min, o) =>
      o.salePrice < min.salePrice ? o : min,
    );

    return {
      hasPriceDifference,
      options,
      lowestPrice: lowestOption.salePrice,
      lowestItemId: lowestOption.itemId,
      apiPrice,
    };
  } catch {
    return null;
  }
}

/**
 * 옵션별 비율 기반 가중평균 매출 계산
 * @param sales - 판매량
 * @param options - 옵션 가격 정보 배열
 * @param ratios - 각 옵션의 판매 비율 (0~1, 합계 1)
 * @returns 가중평균 매출
 */
export function calculateWeightedRevenue(
  sales: number,
  options: OptionPriceInfo[],
  ratios: number[],
): number {
  let weightedPrice = 0;
  for (let i = 0; i < options.length; i++) {
    weightedPrice += options[i].salePrice * (ratios[i] ?? 0);
  }
  return Math.round(sales * weightedPrice);
}

function parsePriceString(price?: string): number | null {
  if (!price) return null;
  const cleaned = price.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return isFinite(num) ? num : null;
}

function buildProductUrl(
  productId: string,
  itemId: string,
  vendorItemId: string,
): string {
  const params = new URLSearchParams();
  if (itemId) params.set("itemId", itemId);
  if (vendorItemId) params.set("vendorItemId", vendorItemId);
  const qs = params.toString();
  return `https://www.coupang.com/vp/products/${productId}${qs ? "?" + qs : ""}`;
}
