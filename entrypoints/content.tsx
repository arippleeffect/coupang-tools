/**
 * Content Script (Refactored)
 *
 * Main entry point for content script functionality
 * Orchestrates feature modules for product metrics, product info, and excel export
 */

import { MESSAGE_TYPE } from "@/types";
import { ProductStore } from "@/modules/core/state";
import { isCoupangProductUrl } from "@/modules/core/dom";
import { renderErrorToast } from "@/modules/ui/toastRenderer";
import { handleViewProductMetrics } from "@/modules/features/product-metrics";
import { renderProductBox } from "@/modules/features/product-metrics/renderer";
import { setupLazyProductInfo } from "@/modules/features/product-info";
import { handleVendorReturnExport } from "@/modules/features/excel-export";
import { updateBanner, resetBanner } from "@/modules/features/banner";
import { SELECTORS } from "@/modules/constants/selectors";
import { showLoginToast } from "@/modules/features/login/login-handler";

export default defineContentScript({
  matches: [
    "https://wing.coupang.com/*",
    "https://shop.coupang.com/*",
    "https://www.coupang.com/*",
  ],
  main(ctx) {
    // Initialize product info on product detail pages
    if (isCoupangProductUrl(location.href)) {
      setupLazyProductInfo();
    }

    // Initialize product store
    const store = new ProductStore();

    // Subscribe to state changes for rendering
    store.subscribe((state) => {
      state.forEach((product) => {
        renderProductBox(product, createRetryHandler(store, ctx));
      });
      console.log("ctx1", ctx);
      console.log("state", state);
      updateBanner(ctx, state);
    });

    // Message listener
    browser.runtime.onMessage.addListener(async (msg) => {
      console.log("메시지", msg);
      // Handle vendor return Excel export (no token required)
      if (msg.type === MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL) {
        await handleVendorReturnExport();
        return;
      }

      // Check token for other message types (except EXCEL_DOWNLOAD_BANNER_INIT)
      if (msg.type !== MESSAGE_TYPE.EXCEL_DOWNLOAD_BANNER_INIT && !msg.token) {
        showLoginToast();
        return;
      }

      // Reset banner and metrics
      if (msg.type === MESSAGE_TYPE.EXCEL_DOWNLOAD_BANNER_INIT) {
        store.reset();
        document
          .querySelectorAll(SELECTORS.CT_METRICS)
          .forEach((el) => el.remove());
        resetBanner();
      }

      // Handle view product metrics
      if (msg.type === MESSAGE_TYPE.VIEW_PRODUCT_METRICS) {
        console.log("msg", msg);
        await handleViewProductMetrics(store, renderErrorToast, ctx);
      }
    });
  },
});

/**
 * Create retry handler for failed products
 */
function createRetryHandler(store: ProductStore, ctx: any) {
  return async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    const dataId = event.currentTarget.getAttribute("data-dataid");
    if (!dataId) return;

    const product = store.findProduct(dataId);
    if (!product || !product.productId) return;

    try {
      const { fetchSingleProduct, calculateRate, calculateTotalSales } =
        await import("@/modules/api/client");

      store.updateProduct({ ...product, status: "LOADING", data: undefined });

      const response = await fetchSingleProduct(product.productId);

      store.updateProduct({
        ...product,
        status: "COMPLETE",
        data: {
          brandName: response.brandName,
          pv: response.pvLast28Day,
          sales: response.salesLast28d,
          totalSales: calculateTotalSales(
            response.salesLast28d,
            response.salePrice
          ),
          rate: calculateRate(response.pvLast28Day, response.salesLast28d),
        },
      });
    } catch (error: any) {
      if (error.code === "EMPTY") {
        store.updateProduct({ ...product, status: "EMPTY" });
      } else {
        store.updateProduct({ ...product, status: "FAIL" });
        renderErrorToast(ctx, error.message ?? error.error);
      }
    }
  };
}
