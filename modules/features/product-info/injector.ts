import { SELECTORS } from "@/modules/constants/selectors";
import type { PriceValidationResult } from "@/types";
import "@/modules/ui/product-info.css";

/**
 * 헤더 다음에 인사 배너 주입
 * @param text - 표시할 텍스트
 * @returns 주입 성공 여부
 */
export function injectHelloBannerAfterHeader(
  text: string = "안녕하세요",
): boolean {
  const root = document.querySelector(
    SELECTORS.PRODUCT_DETAIL_CONTAINER,
  ) as HTMLElement | null;
  if (!root) return false;
  if (root.querySelector(".ct-hello.inline")) return true;

  const el = document.createElement("div");
  el.className = "ct-hello blue inline";
  el.textContent = text;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) {
    first.insertAdjacentElement("afterend", el);
  } else {
    root.prepend(el);
  }
  return true;
}

/**
 * 헤더 다음에 상품 정보 주입
 * @param info - 상품 정보
 * @returns 주입 성공 여부
 */
export function injectProductInfoAfterHeader(info: {
  productId: string;
  itemId?: string | number;
  brandName?: string;
  pvLast28Day?: number;
  salesLast28d?: number;
  rateText?: string;
  totalSales?: string;
  priceValidation?: PriceValidationResult;
}): boolean {
  const root = document.querySelector(
    SELECTORS.PRODUCT_DETAIL_CONTAINER,
  ) as HTMLElement | null;
  if (!root) return false;

  const prev = root.querySelector(SELECTORS.CT_PRODINFO);
  if (prev) prev.remove();

  const fmtInt = (n: any) => {
    const v = Number(n);
    if (!isFinite(v)) return "-";
    return v.toLocaleString("ko-KR");
  };

  const el = document.createElement("div");
  el.className = "ct-prodinfo compact";
  const brand = info.brandName ?? "-";
  const pv = info.pvLast28Day ?? "-";
  const sales = info.salesLast28d ?? "-";
  const rate = info.rateText ?? "-";
  const totalSales = info.totalSales ?? "-";
  const pv_ = info.priceValidation;
  const hasWarning = pv_?.hasPriceDifference === true;

  const revenueDisplay = hasWarning
    ? `<span class="ct-price-warn"><span class="value ct-unknown-sales">정확한 매출가를 알 수 없음</span><span class="ct-warn-tooltip">옵션별 판매가가 상이하여 정확한 매출 금액 산출이 불가능함<br>판매량 지표를 참고하여 매출 규모를 유추할 수 있음</span></span>`
    : `<span class="value chip sales ct-revenue-display">${totalSales}</span>`;

  el.innerHTML = `
    <div class="wrap">
      <div class="line">
        <span class="kv"><span class="label">노출상품ID</span><span class="value">${
          info.productId
        }</span></span>
        <span class="sep">·</span>
        <span class="kv"><span class="label">옵션ID</span><span class="value">${info.itemId ?? "-"}</span></span>
        <span class="sep">·</span>
        <span class="kv"><span class="label">브랜드</span><span class="value">${brand}</span></span>
      </div>
      <div class="line">
        <span class="kv"><span class="label">조회</span><span class="value chip pv">${fmtInt(
          pv,
        )}</span></span>
        <span class="kv"><span class="label">판매<span class="ct-info-icon">&#9432;<span class="ct-info-tooltip">해당 판매량은 옵션별 판매량이 아닌<br>전체 옵션을 합산한 총 판매량임</span></span></span><span class="value chip sales">${fmtInt(
          sales,
        )}개</span></span>
        <span class="kv"><span class="label">전환</span><span class="value chip rate">${rate}</span></span>
        <span class="kv"><span class="label">매출</span>${revenueDisplay}</span>
      </div>
      <div class="sub">최근 28일 기준</div>
    </div>`;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);

  return true;
}

/**
 * 라이선스 확인 중 로딩 주입
 * @returns 주입 성공 여부
 */
export function injectLicenseCheckingInfo(): boolean {
  const root = document.querySelector(
    SELECTORS.PRODUCT_DETAIL_CONTAINER,
  ) as HTMLElement | null;
  if (!root) return false;

  const prev = root.querySelector(SELECTORS.CT_PRODINFO);
  if (prev) prev.remove();

  const el = document.createElement("div");
  el.className = "ct-prodinfo compact";
  el.innerHTML = `
    <div class="wrap">
      <div class="line" style="justify-content:center;">
        <span class="kv"><span class="label">라이선스 확인 중...</span>
        <span class="value" style="margin-left:6px;">
          <span class="chip pv" style="display:inline-flex;align-items:center;">
            <span class="spinner" style="width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:ctspin .8s linear infinite;display:inline-block;margin-right:5px;"></span>
            확인중
          </span>
        </span>
        </span>
      </div>
    </div>`;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);
  return true;
}

/**
 * 로딩 중 상품 정보 주입
 * @returns 주입 성공 여부
 */
export function injectLoadingProductInfo(): boolean {
  const root = document.querySelector(
    SELECTORS.PRODUCT_DETAIL_CONTAINER,
  ) as HTMLElement | null;
  if (!root) return false;

  const prev = root.querySelector(SELECTORS.CT_PRODINFO);
  if (prev) prev.remove();

  const el = document.createElement("div");
  el.className = "ct-prodinfo compact";
  el.innerHTML = `
    <div class="wrap">
      <div class="line" style="justify-content:center;">
        <span class="kv"><span class="label">상품 정보 불러오는 중...</span>
        <span class="value" style="margin-left:6px;">
          <span class="chip pv" style="display:inline-flex;align-items:center;">
            <span class="spinner" style="width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:ctspin .8s linear infinite;display:inline-block;margin-right:5px;"></span>
            로딩중
          </span>
        </span>
        </span>
      </div>
    </div>`;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);
  return true;
}

/**
 * 실패 상품 정보 주입
 * @param pid - 상품 ID
 * @returns 주입 성공 여부
 */
export function injectFailProductInfo(pid: string): boolean {
  const root = document.querySelector(
    SELECTORS.PRODUCT_DETAIL_CONTAINER,
  ) as HTMLElement | null;
  if (!root) return false;

  const prev = root.querySelector(SELECTORS.CT_PRODINFO);
  if (prev) prev.remove();

  const el = document.createElement("div");
  el.className = "ct-prodinfo compact";
  el.innerHTML = `
    <div class="wrap">
      <div class="line" style="justify-content:center;">
        <span class="kv"><span class="label">상품 정보를 불러오지 못했습니다.</span>
          <button class="retry-btn" style="margin-left:12px;">다시 시도</button>
        </span>
      </div>
    </div>
  `;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);

  return true;
}

/**
 * 빈 상품 정보 주입
 * @returns 주입 성공 여부
 */
export function injectEmptyProductInfo(): boolean {
  const root = document.querySelector(
    SELECTORS.PRODUCT_DETAIL_CONTAINER,
  ) as HTMLElement | null;
  if (!root) return false;

  const prev = root.querySelector(SELECTORS.CT_PRODINFO);
  if (prev) prev.remove();

  const el = document.createElement("div");
  el.className = "ct-prodinfo compact";
  el.innerHTML = `
    <div class="wrap">
      <div class="line" style="justify-content:center;">
        <span class="kv"><span class="label">쿠팡에서 제공하지 않는 상품입니다</span></span>
      </div>
      <div class="sub">일부 상품은 조회수·판매량 등의 지표가 제공되지 않을 수 있습니다</div>
    </div>
  `;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);

  return true;
}

/**
 * 로그인 필요 상품 정보 주입
 * @returns 주입 성공 여부
 */
export function injectLoginRequiredProductInfo(): boolean {
  const root = document.querySelector(
    SELECTORS.PRODUCT_DETAIL_CONTAINER,
  ) as HTMLElement | null;
  if (!root) return false;

  const prev = root.querySelector(SELECTORS.CT_PRODINFO);
  if (prev) prev.remove();

  const el = document.createElement("div");
  el.className = "ct-prodinfo compact";
  el.innerHTML = `
    <div class="wrap">
      <div class="line" style="justify-content:center;">
        <span class="kv">
          <span class="label">쿠팡윙 로그인이 필요합니다</span>
          <button class="login-btn" style="margin-left:12px;background:#10b981;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">
            쿠팡윙 로그인 →
          </button>
        </span>
      </div>
    </div>
  `;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);

  const loginBtn = el.querySelector(".login-btn") as HTMLButtonElement | null;
  if (loginBtn) {
    loginBtn.onclick = () => {
      window.open("https://wing.coupang.com/login", "_blank");
    };
  }

  return true;
}
