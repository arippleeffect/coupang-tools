import {
  waitForElement,
  debounce,
  getIdFromLocation,
  getVendorItemIdFromUrl,
  getProductIdFromPath,
} from "@/modules/core/dom";
import { fetchSingleProduct, calculateRate } from "@/modules/api/client";
import { formatCurrencyKRW } from "@/modules/ui/metrics";
import {
  injectProductInfoAfterHeader,
  injectLoadingProductInfo,
  injectLicenseCheckingInfo,
  injectFailProductInfo,
  injectEmptyProductInfo,
  injectLoginRequiredProductInfo,
} from "./injector";
import { ensureHelloStyle } from "./styles";
import { SELECTORS } from "@/modules/constants/selectors";
import { isLoginRequiredError } from "@/modules/features/login/login-handler";
import { showErrorToast } from "./toast-error";
import { validateLicenseOnAction } from "@/modules/core/license-validator";
import { validateOptionPrices } from "@/modules/features/price-validation";

async function injectLicenseRequiredBanner() {
  const root = document.querySelector(SELECTORS.PRODUCT_DETAIL_CONTAINER);
  if (!root) return;

  const existing = root.querySelector(SELECTORS.CT_PRODINFO);
  if (existing) existing.remove();

  const banner = document.createElement("div");
  banner.className = "ct-prodinfo";
  banner.style.cssText = `
    background: #fef2f2;
    border: 2px solid #fca5a5;
    border-radius: 12px;
    padding: 20px;
    margin: 16px 0;
    text-align: center;
  `;

  banner.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 12px;">🔐</div>
    <h3 style="font-size: 18px; font-weight: 700; color: #991b1b; margin-bottom: 8px;">
      라이선스 활성화 필요
    </h3>
    <p style="font-size: 14px; color: #991b1b; margin-bottom: 16px;">
      이 기능을 사용하려면 라이선스를 활성화해야 합니다.
    </p>
    <button class="license-activate-btn" style="
      background: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    ">
      라이선스 활성화
    </button>
  `;

  const btn = banner.querySelector(
    ".license-activate-btn",
  ) as HTMLButtonElement;
  btn.onmouseover = () => {
    btn.style.background = "#2563eb";
  };
  btn.onmouseout = () => {
    btn.style.background = "#3b82f6";
  };
  btn.onclick = () => {
    const licensePageUrl = browser.runtime.getURL("license.html");
    window.open(licensePageUrl, "_blank");
  };

  const anchor = root.querySelector("");
  if (anchor?.parentElement) {
    anchor.parentElement.insertBefore(banner, anchor.nextSibling);
  }
}

export async function fetchAndInjectProductInfo(pid: string) {
  try {
    const matched = await fetchSingleProduct(pid);

    const rateText = calculateRate(matched.pvLast28Day, matched.salesLast28d);
    const totalSalesValue =
      typeof matched.salesLast28d === "number" &&
      typeof matched.salePrice === "number"
        ? formatCurrencyKRW(matched.salesLast28d * matched.salePrice)
        : "-";

    // 먼저 기본 지표 렌더링
    injectProductInfoAfterHeader({
      productId: String(pid),
      itemId: matched.itemId,
      brandName: matched?.brandName,
      pvLast28Day: matched?.pvLast28Day,
      salesLast28d: matched?.salesLast28d,
      rateText,
      totalSales: totalSalesValue,
    });

    // 비동기로 가격 검증 수행 (실패해도 기존 지표 유지)
    const productId = getProductIdFromPath();
    const vendorItemId = getVendorItemIdFromUrl();
    if (productId && vendorItemId && typeof matched.salePrice === "number") {
      validateOptionPrices(productId, vendorItemId, matched.salePrice).then(
        (priceValidation) => {
          if (priceValidation?.hasPriceDifference) {
            // 가격 차이 발견 시 매출 숨기고 재렌더링
            injectProductInfoAfterHeader({
              productId: String(pid),
              itemId: matched.itemId,
              brandName: matched?.brandName,
              pvLast28Day: matched?.pvLast28Day,
              salesLast28d: matched?.salesLast28d,
              rateText,
              totalSales: undefined,
              priceValidation,
            });
          }
        },
      );
    }
  } catch (e: any) {
    if (isLoginRequiredError(e)) {
      injectLoginRequiredProductInfo();
      return;
    }

    if (e.code === "EMPTY") {
      injectEmptyProductInfo();
      return;
    }

    injectFailProductInfo(pid);
    setupRetryHandler(pid);
    showErrorToast(
      e.message || e.error || "상품 정보를 불러오는 중 오류가 발생했습니다",
    );
  }
}

/**
 * Setup lazy product info injection
 */
export function setupLazyProductInfo() {
  const exec = async () => {
    const id = getIdFromLocation();
    if (!id) return;

    try {
      await waitForElement(SELECTORS.PRODUCT_DETAIL_CONTAINER, 12000);
    } catch {}

    ensureHelloStyle();

    // Show license checking loading first
    injectLicenseCheckingInfo();

    // Check license (매 요청마다 서버 체크)
    const licenseResult = await validateLicenseOnAction();
    if (!licenseResult.valid) {
      await injectLicenseRequiredBanner();
      return;
    }

    // License valid - show product loading
    injectLoadingProductInfo();
    fetchAndInjectProductInfo(id);

    const root = document.querySelector(SELECTORS.PRODUCT_DETAIL_CONTAINER);
    if (!root) return;

    const ensure = debounce(async () => {
      const banner = root.querySelector(SELECTORS.CT_PRODINFO);
      const curId = getIdFromLocation();
      if (!banner && curId) {
        injectLicenseCheckingInfo();
        const licenseResult = await validateLicenseOnAction();
        if (!licenseResult.valid) {
          await injectLicenseRequiredBanner();
          return;
        }
        injectLoadingProductInfo();
        fetchAndInjectProductInfo(curId);
      }
    }, 150);

    const mo = new MutationObserver(() => ensure());
    mo.observe(root, { childList: true, subtree: true });

    const reMount = () =>
      setTimeout(async () => {
        const nid = getIdFromLocation();
        if (nid) {
          injectLicenseCheckingInfo();
          const licenseResult = await validateLicenseOnAction();
          if (!licenseResult.valid) {
            await injectLicenseRequiredBanner();
            return;
          }
          injectLoadingProductInfo();
          fetchAndInjectProductInfo(nid);
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
      { once: true },
    );
  }
}

export function setupRetryHandler(pid: string) {
  const root = document.querySelector(SELECTORS.PRODUCT_DETAIL_CONTAINER);
  if (!root) return;

  const btn = root.querySelector(".retry-btn") as HTMLButtonElement | null;
  if (btn) {
    btn.onclick = () => {
      injectLoadingProductInfo();
      fetchAndInjectProductInfo(pid);
    };
  }
}
