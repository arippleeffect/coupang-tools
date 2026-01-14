/**
 * Product Info Feature
 *
 * Displays product information on product detail pages
 */

import {
  waitForElement,
  debounce,
  getPidFromLocation,
} from "@/modules/core/dom";
import { fetchSingleProduct, calculateRate } from "@/modules/api/client";
import { formatCurrencyKRW } from "@/modules/ui/metrics";
import {
  injectProductInfoAfterHeader,
  injectLoadingProductInfo,
  injectFailProductInfo,
  injectEmptyProductInfo,
  injectLoginRequiredProductInfo,
} from "./injector";
import { ensureHelloStyle } from "./styles";
import { SELECTORS } from "@/modules/constants/selectors";
import { isLoginRequiredError } from "@/modules/features/login/login-handler";
import { showErrorToast } from "./toast-error";

/**
 * Fetch and inject product information
 */
export async function fetchAndInjectProductInfo(pid: string) {
  try {
    const matched = await fetchSingleProduct(pid);
    console.log("matched::", matched);

    const rateText = calculateRate(matched.pvLast28Day, matched.salesLast28d);
    const totalSalesValue =
      typeof matched.salesLast28d === "number" &&
      typeof matched.salePrice === "number"
        ? formatCurrencyKRW(matched.salesLast28d * matched.salePrice)
        : "-";

    injectProductInfoAfterHeader({
      productId: String(pid),
      brandName: matched?.brandName,
      pvLast28Day: matched?.pvLast28Day,
      salesLast28d: matched?.salesLast28d,
      rateText,
      totalSales: totalSalesValue,
    });
  } catch (e: any) {
    console.log("에러", e);

    // 1. Check if login is required - show inline login UI (no toast)
    if (isLoginRequiredError(e)) {
      injectLoginRequiredProductInfo();
      return;
    }

    // 2. Check if product data is empty (EMPTY code, no toast)
    if (e.code === "EMPTY") {
      injectEmptyProductInfo();
      return;
    }

    // 3. Other errors - show retry UI with handler and error toast
    injectFailProductInfo(pid);
    setupRetryHandler(pid);
    showErrorToast(e.message || e.error || "상품 정보를 불러오는 중 오류가 발생했습니다");
  }
}

/**
 * Setup lazy product info injection
 */
export function setupLazyProductInfo() {
  console.log("setupLazyProductInfo");
  const exec = async () => {
    const pid = getPidFromLocation();
    if (!pid) return;

    try {
      await waitForElement(SELECTORS.PRODUCT_DETAIL_CONTAINER, 12000);
    } catch {}

    ensureHelloStyle();
    injectLoadingProductInfo();
    console.log("1-4");
    fetchAndInjectProductInfo(pid);

    // Keep it persistent: re-inject if DOM re-renders
    const root = document.querySelector(SELECTORS.PRODUCT_DETAIL_CONTAINER);
    if (!root) return;

    const ensure = debounce(() => {
      const banner = root.querySelector(SELECTORS.CT_PRODINFO);
      const curPid = getPidFromLocation();
      if (!banner && curPid) {
        injectLoadingProductInfo();
        console.log("1-5");
        fetchAndInjectProductInfo(curPid);
      }
    }, 150);

    const mo = new MutationObserver(() => ensure());
    mo.observe(root, { childList: true, subtree: true });

    // React to SPA navigations
    const reMount = () =>
      setTimeout(() => {
        const npid = getPidFromLocation();
        if (npid) {
          injectLoadingProductInfo();
          console.log("1-1");
          fetchAndInjectProductInfo(npid);
        }
      }, 60);

    window.addEventListener("hashchange", reMount);
    window.addEventListener("popstate", reMount);
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    (window as any).requestIdleCallback
      ? (window as any).requestIdleCallback(exec, { timeout: 1200 })
      : setTimeout(exec, 0);
  } else {
    window.addEventListener(
      "DOMContentLoaded",
      () => {
        (window as any).requestIdleCallback
          ? (window as any).requestIdleCallback(exec, { timeout: 1200 })
          : setTimeout(exec, 0);
      },
      { once: true }
    );
  }
}

/**
 * Setup retry button handler for failed product info
 */
export function setupRetryHandler(pid: string) {
  const root = document.querySelector(SELECTORS.PRODUCT_DETAIL_CONTAINER);
  if (!root) return;

  const btn = root.querySelector(".retry-btn") as HTMLButtonElement | null;
  if (btn) {
    btn.onclick = () => {
      injectLoadingProductInfo();
      console.log("1-2");
      fetchAndInjectProductInfo(pid);
    };
  }
}
