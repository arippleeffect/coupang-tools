import { ProductStore } from "@/modules/core/state";
import type { ProductState } from "@/types";
import {
  fetchProducts,
  fetchSingleProduct,
  calculateRate,
  calculateTotalSales,
} from "@/modules/api/client";
import {
  getProductListElement,
  liElementsToProducts,
  getSearchKeywordFromUrl,
} from "./parser";
import { renderProductBox, initMetricsStyle } from "./renderer";
import {
  isLoginRequiredError,
  showLoginToast,
} from "@/modules/features/login/login-handler";
import { validateOptionPrices } from "@/modules/features/price-validation";

/**
 * 가격 검증 수행 헬퍼
 * @param store - 상품 스토어
 * @param product - 상품 상태
 * @param vendorItemId - 벤더 아이템 ID
 * @param salePrice - 판매 가격
 * @param sales - 판매량
 */
async function runPriceValidation(
  store: ProductStore,
  product: ProductState,
  vendorItemId: string,
  salePrice: number,
  sales: number,
) {
  try {
    const priceValidation = await validateOptionPrices(
      product.productId,
      vendorItemId,
      salePrice,
    );

    const current = store.findProduct(product.dataId);
    if (priceValidation?.hasPriceDifference && current?.data) {
      const lowestTotalSales = calculateTotalSales(
        sales,
        priceValidation.lowestPrice,
      );
      store.updateProduct({
        ...current,
        data: {
          ...current.data,
          totalSales: lowestTotalSales,
          priceValidation,
        },
      });
    }
  } catch {
    // 가격 검증 실패 시 기존 지표 유지
  }
}

/**
 * 상품 지표 보기 핸들러
 * @param store - 상품 스토어
 * @param renderErrorToast - 에러 토스트 렌더링 함수
 * @param ctx - 컨텍스트
 */
export async function handleViewProductMetrics(
  store: ProductStore,
  renderErrorToast: (ctx: any, message: string, code?: string) => void,
  ctx: any,
) {
  try {
    initMetricsStyle();

    const productListElement = getProductListElement();
    const liElements = productListElement?.getElementsByTagName("li");
    const products = liElementsToProducts(liElements);

    store.setProducts(products);

    products.forEach((product) => {
      renderProductBox(
        product,
        createRetryHandler(store, renderErrorToast, ctx),
      );
    });

    const keyword = getSearchKeywordFromUrl();
    if (!keyword) {
      throw {
        code: "NO_KEYWORD",
        message: "URL에 검색 키워드가 없습니다.",
      };
    }

    const result = await fetchProducts(keyword);

    products.forEach((product) => {
      const matched = result.find(
        (r) =>
          String(r.productId) === String(product.productId) &&
          String(r.itemId) === String(product.itemId),
      );

      if (!matched) {
        store.updateProduct({ ...product, status: "FAIL" });
        return;
      }

      store.updateProduct({
        ...product,
        status: "COMPLETE",
        data: {
          brandName: matched.brandName,
          pv: matched.pvLast28Day,
          sales: matched.salesLast28d,
          totalSales: calculateTotalSales(
            matched.salesLast28d,
            matched.salePrice,
          ),
          rate: calculateRate(matched.pvLast28Day, matched.salesLast28d),
        },
      });

      // 1차 루프에서 바로 가격 검증 수행
      if (product.vendorItemId) {
        runPriceValidation(
          store,
          product,
          product.vendorItemId,
          matched.salePrice,
          matched.salesLast28d,
        );
      }
    });

    const noDataStates = store
      .getState()
      .filter((item) => item.status === "FAIL" || item.status === undefined);

    noDataStates.forEach(async (product) => {
      store.updateProduct({ ...product, status: "LOADING", data: undefined });

      try {
        const response = await fetchSingleProduct(product.itemId!);

        store.updateProduct({
          ...product,
          status: "COMPLETE",
          data: {
            brandName: response.brandName,
            pv: response.pvLast28Day,
            sales: response.salesLast28d,
            totalSales: calculateTotalSales(
              response.salesLast28d,
              response.salePrice,
            ),
            rate: calculateRate(response.pvLast28Day, response.salesLast28d),
          },
        });

        // 2차 루프에서 fetchSingleProduct 성공 후 바로 가격 검증 수행
        if (product.vendorItemId) {
          runPriceValidation(
            store,
            product,
            product.vendorItemId,
            response.salePrice,
            response.salesLast28d,
          );
        }
      } catch (err: any) {
        if (isLoginRequiredError(err)) {
          showLoginToast();
          store.updateProduct({ ...product, status: "FAIL" });
          return;
        }

        if (err.code === "EMPTY") {
          store.updateProduct({ ...product, status: "EMPTY" });
        } else {
          store.updateProduct({ ...product, status: "FAIL" });
        }
      }
    });
  } catch (error: any) {
    console.error("[handleViewProductMetrics] Caught error:", error);
    document.querySelectorAll(".ct-metrics").forEach((el) => el.remove());

    if (isLoginRequiredError(error)) {
      showLoginToast();
      return;
    }

    renderErrorToast(ctx, error.message ?? error.error, error.code);
  }
}

/**
 * 재시도 핸들러 생성
 * @param store - 상품 스토어
 * @param renderErrorToast - 에러 토스트 렌더링 함수
 * @param ctx - 컨텍스트
 * @returns 재시도 이벤트 핸들러
 */
function createRetryHandler(
  store: ProductStore,
  renderErrorToast: (ctx: any, message: string, code?: string) => void,
  ctx: any,
) {
  return async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const dataId = event.currentTarget.getAttribute("data-dataid");
    if (!dataId) return;

    const product = store.findProduct(dataId);
    if (!product) return;

    try {
      store.updateProduct({ ...product, status: "LOADING", data: undefined });

      const retryResponse = await fetchSingleProduct(product.itemId!);

      store.updateProduct({
        ...product,
        status: "COMPLETE",
        data: {
          brandName: retryResponse.brandName,
          pv: retryResponse.pvLast28Day,
          sales: retryResponse.salesLast28d,
          totalSales: calculateTotalSales(
            retryResponse.salesLast28d,
            retryResponse.salePrice,
          ),
          rate: calculateRate(
            retryResponse.pvLast28Day,
            retryResponse.salesLast28d,
          ),
        },
      });
    } catch (error: any) {
      if (isLoginRequiredError(error)) {
        showLoginToast();
        store.updateProduct({ ...product, status: "FAIL" });
        return;
      }

      if (error.code === "EMPTY") {
        store.updateProduct({ ...product, status: "EMPTY" });
      } else {
        store.updateProduct({ ...product, status: "FAIL" });
        if (!isLoginRequiredError(error)) {
          renderErrorToast(ctx, error.message ?? error.error, error.code);
        }
      }
    }
  };
}
