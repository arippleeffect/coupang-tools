import { SELECTORS } from "@/modules/constants/selectors";
import type { ProductState, ProductType } from "@/types";

/**
 * li 요소 목록을 ProductState 배열로 변환
 * @param list - li 요소 컬렉션
 * @returns 상품 상태 배열
 */
export function liElementsToProducts(
  list: HTMLCollectionOf<HTMLLIElement> | undefined
): ProductState[] {
  if (!list) return [];

  const productItems = Array.from(list).filter(
    (el) =>
      el.classList.contains(SELECTORS.PRODUCT_UNIT.slice(1)) || // www.coupang.com search
      el.classList.contains("product-wrap") || // shop.coupang.com old
      el.classList.contains("product-wrapper") // shop.coupang.com new
  );

  return productItems.map((el, index) => {
    let dataId = el.dataset.id;
    if (!dataId || dataId === "0") {
      dataId = `auto-${Date.now()}-${index}`;
      el.dataset.id = dataId;
    }

    let aTag = el.children[0]?.getAttribute?.("href");
    if (!aTag) {
      const anchor = el.querySelector('a[href*="/products/"]');
      aTag = anchor?.getAttribute("href") || "";
    }

    const match = aTag && aTag.match(/products\/(\d+)/);
    const productId = match ? match[1] : undefined;

    let itemId: string | undefined;
    let vendorItemId: string | undefined;
    try {
      if (aTag) {
        const url = new URL(aTag, location.origin);
        itemId = url.searchParams.get("itemId") ?? undefined;
        vendorItemId = url.searchParams.get("vendorItemId") ?? undefined;
      }
    } catch {}

    const type: ProductType = el.querySelector(SELECTORS.AD_MARK)
      ? "AD"
      : "NORMAL";

    let productName = el
      .querySelector<HTMLElement>(SELECTORS.PRODUCT_NAME)
      ?.textContent?.trim();
    if (!productName) {
      productName =
        el.querySelector<HTMLElement>(".name")?.textContent?.trim() ?? "";
    }

    return {
      dataId,
      productId,
      itemId,
      vendorItemId,
      productName,
      status: "LOADING",
      type,
      data: undefined,
    };
  }) as ProductState[];
}

/**
 * DOM에서 상품 리스트 요소 조회
 * @returns 상품 리스트 요소
 */
export function getProductListElement(): HTMLElement {
  let productListElement = document.getElementById("product-list");

  if (!productListElement) {
    productListElement =
      document.querySelector<HTMLElement>("ul.products-list");
  }

  if (!productListElement) {
    throw {
      code: "NO_PRODUCT_LIST",
      message: "쿠팡 제품 리스트를 찾을 수 없습니다.",
    };
  }

  return productListElement;
}

/**
 * URL에서 검색 키워드 추출
 * @returns 검색 키워드 또는 null
 */
export function getSearchKeywordFromUrl(): string | null {
  const keyword = new URL(location.href).searchParams.get("q");

  if (!keyword) {
    return document.querySelectorAll("h1")[0]?.textContent || null;
  }
  return keyword;
}
