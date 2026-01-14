/**
 * Product Metrics Message Handler
 *
 * Handles VIEW_PRODUCT_METRICS message and orchestrates the flow
 */

import { ProductStore } from '@/modules/core/state';
import { fetchProducts, fetchSingleProduct, calculateRate, calculateTotalSales } from '@/modules/api/client';
import { getProductListElement, liElementsToProducts, getSearchKeywordFromUrl } from './parser';
import { renderProductBox, initMetricsStyle } from './renderer';
import { isLoginRequiredError, showLoginToast } from '@/modules/features/login/login-handler';
import type { ProductState } from '@/types';

/**
 * Handle VIEW_PRODUCT_METRICS message
 */
export async function handleViewProductMetrics(
  store: ProductStore,
  renderErrorToast: (ctx: any, message: string) => void,
  ctx: any
) {
  try {
    initMetricsStyle();

    const productListElement = getProductListElement();
    const liElements = productListElement?.getElementsByTagName('li');
    const products = liElementsToProducts(liElements);

    store.setProducts(products);

    // Render all products initially with LOADING state
    products.forEach((product) => {
      renderProductBox(product, createRetryHandler(store, renderErrorToast, ctx));
    });

    // First batch request by keyword
    const keyword = getSearchKeywordFromUrl();
    if (!keyword) {
      throw {
        code: 'NO_KEYWORD',
        message: 'URL에 검색 키워드가 없습니다.',
      };
    }

    const result = await fetchProducts(keyword);

    products.forEach((product) => {
      const matched = result.find(
        (r) => String(r.productId) === String(product.productId)
      );

      if (!matched) {
        store.updateProduct({ ...product, status: 'FAIL' });
        return;
      }

      // Update with complete data
      store.updateProduct({
        ...product,
        status: 'COMPLETE',
        data: {
          brandName: matched.brandName,
          pv: matched.pvLast28Day,
          sales: matched.salesLast28d,
          totalSales: calculateTotalSales(matched.salesLast28d, matched.salePrice),
          rate: calculateRate(matched.pvLast28Day, matched.salesLast28d),
        },
      });
    });

    // Fetch individual products that failed
    const noDataStates = store.getState().filter(
      (item) => item.status === 'FAIL' || item.status === undefined
    );

    noDataStates.forEach(async (product) => {
      store.updateProduct({ ...product, status: 'LOADING', data: undefined });

      try {
        const response = await fetchSingleProduct(product.productId!);

        store.updateProduct({
          ...product,
          status: 'COMPLETE',
          data: {
            brandName: response.brandName,
            pv: response.pvLast28Day,
            sales: response.salesLast28d,
            totalSales: calculateTotalSales(response.salesLast28d, response.salePrice),
            rate: calculateRate(response.pvLast28Day, response.salesLast28d),
          },
        });
      } catch (err: any) {
        // Check if login is required
        if (isLoginRequiredError(err)) {
          showLoginToast();
          store.updateProduct({ ...product, status: 'FAIL' });
          return;
        }

        // Always update to FAIL or EMPTY, never leave in LOADING state
        if (err.code === 'EMPTY') {
          store.updateProduct({ ...product, status: 'EMPTY' });
        } else {
          store.updateProduct({ ...product, status: 'FAIL' });
        }
      }
    });
  } catch (error: any) {
    console.error('[handleViewProductMetrics] Caught error:', error);
    document.querySelectorAll('.ct-metrics').forEach((el) => el.remove());

    // Check if login required
    if (isLoginRequiredError(error)) {
      console.log('[handleViewProductMetrics] Login required, showing toast');
      showLoginToast();
      return;
    }

    // Show error toast for other errors
    console.log('[handleViewProductMetrics] Showing error toast');
    renderErrorToast(ctx, error.message ?? error.error);
  }
}

/**
 * Create retry handler for failed products
 */
function createRetryHandler(
  store: ProductStore,
  renderErrorToast: (ctx: any, message: string) => void,
  ctx: any
) {
  return async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const dataId = event.currentTarget.getAttribute('data-dataid');
    if (!dataId) return;

    const product = store.findProduct(dataId);
    if (!product) return;

    try {
      store.updateProduct({ ...product, status: 'LOADING', data: undefined });

      const retryResponse = await fetchSingleProduct(product.productId!);

      store.updateProduct({
        ...product,
        status: 'COMPLETE',
        data: {
          brandName: retryResponse.brandName,
          pv: retryResponse.pvLast28Day,
          sales: retryResponse.salesLast28d,
          totalSales: calculateTotalSales(retryResponse.salesLast28d, retryResponse.salePrice),
          rate: calculateRate(retryResponse.pvLast28Day, retryResponse.salesLast28d),
        },
      });
    } catch (error: any) {
      // Check if login is required
      if (isLoginRequiredError(error)) {
        showLoginToast();
        store.updateProduct({ ...product, status: 'FAIL' });
        return;
      }

      if (error.code === 'EMPTY') {
        store.updateProduct({ ...product, status: 'EMPTY' });
      } else {
        store.updateProduct({ ...product, status: 'FAIL' });
        // Don't show error toast for login required errors
        if (!isLoginRequiredError(error)) {
          renderErrorToast(ctx, error.message ?? error.error);
        }
      }
    }
  };
}
