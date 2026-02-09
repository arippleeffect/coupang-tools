import { SELECTORS } from "@/modules/constants/selectors";
import type { PriceValidationResult } from "@/types";
import { calculateWeightedRevenue } from "@/modules/features/price-validation";

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

  const fmtPrice = (n: number) => n.toLocaleString("ko-KR") + "원";

  const el = document.createElement("div");
  el.className = "ct-prodinfo compact";
  const brand = info.brandName ?? "-";
  const pv = info.pvLast28Day ?? "-";
  const sales = info.salesLast28d ?? "-";
  const rate = info.rateText ?? "-";
  const totalSales = info.totalSales ?? "-";
  const pv_ = info.priceValidation;
  const hasWarning = pv_?.hasPriceDifference === true;

  const warningIcon = hasWarning
    ? `<span class="ct-price-warn">⚠<span class="ct-warn-tooltip">옵션별 금액이 달라 정확한 매출 산출이 어렵습니다. 비율을 설정하여 매출을 추정할 수 있습니다.</span></span>`
    : "";

  const toggleBtn = hasWarning
    ? `<button class="ct-option-toggle">옵션별 판매 비율 설정</button>`
    : "";

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
        <span class="sep">·</span>
        <span class="kv"><span class="label">조회</span><span class="value chip pv">${fmtInt(
          pv,
        )}</span></span>
        <span class="kv"><span class="label">판매</span><span class="value chip sales">${fmtInt(
          sales,
        )}</span></span>
        <span class="kv"><span class="label">전환</span><span class="value chip rate">${rate}</span></span>
        <span class="kv"><span class="label">매출</span><span class="value chip sales ct-revenue-display">${totalSales}</span>${warningIcon}</span>
      </div>
      ${toggleBtn}
      <div class="sub">최근 28일 기준</div>
    </div>`;

  const first = root.firstElementChild as HTMLElement | null;
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);

  // 다이얼로그 이벤트
  if (hasWarning && pv_) {
    const toggle = el.querySelector(".ct-option-toggle") as HTMLElement | null;
    const mainRevenue = el.querySelector(".ct-revenue-display") as HTMLElement | null;
    const salesNum = Number(info.salesLast28d) || 0;

    if (toggle) {
      toggle.onclick = () => {
        // 기존 다이얼로그가 있으면 제거
        const existing = document.querySelector(".ct-dialog-overlay");
        if (existing) { existing.remove(); return; }

        const optionRows = pv_!.options
          .map((o, i) => {
            const isLowest = o.salePrice === pv_!.lowestPrice;
            const defaultWeight = isLowest ? 1 : 0;
            const link = o.productUrl
              ? `<a href="${o.productUrl}" target="_blank" class="ct-opt-link" onclick="event.stopPropagation()">링크</a>`
              : "";
            return `
              <div class="ct-dialog-row">
                <div class="ct-dialog-opt-info">
                  <span class="ct-dialog-opt-name">${o.optionName || `옵션 ${i + 1}`}</span>
                  <span class="ct-dialog-opt-price">${fmtPrice(o.salePrice)}${isLowest ? " (최저)" : ""}</span>
                </div>
                <div class="ct-dialog-opt-control">
                  <input type="range" class="ct-opt-slider" min="0" max="1" step="0.01" value="${defaultWeight}" data-idx="${i}" data-price="${o.salePrice}">
                  <span class="ct-opt-ratio" data-idx="${i}">${isLowest ? 100 : 0}%</span>
                </div>
                ${link}
              </div>`;
          })
          .join("");

        const overlay = document.createElement("div");
        overlay.className = "ct-dialog-overlay";
        overlay.innerHTML = `
          <div class="ct-dialog" onclick="event.stopPropagation()">
            <div class="ct-dialog-header">
              <span>옵션별 판매 비율 설정</span>
              <button class="ct-dialog-close">✕</button>
            </div>
            <div class="ct-dialog-desc">
              옵션별 개별 판매량은 확인할 수 없고 합산된 판매량만 제공됩니다. 옵션별 금액이 다를 경우 정확한 매출 산출이 어려우므로, 예상 판매 비율을 설정하여 매출을 추정할 수 있습니다.
            </div>
            <div class="ct-dialog-body">${optionRows}</div>
            <div class="ct-dialog-footer">
              <span class="ct-dialog-revenue">매출: ${totalSales}</span>
              <button class="ct-opt-reset-btn">초기화</button>
            </div>
          </div>`;

        document.body.appendChild(overlay);

        const closeDialog = () => overlay.remove();
        overlay.addEventListener("click", closeDialog);
        overlay.querySelector(".ct-dialog-close")!.addEventListener("click", closeDialog);

        // 슬라이더 이벤트 (리스트 페이지와 동일한 정규화 방식)
        const sliders = overlay.querySelectorAll<HTMLInputElement>(".ct-opt-slider");
        const ratioEls = overlay.querySelectorAll<HTMLElement>(".ct-opt-ratio");
        const revenueEl = overlay.querySelector(".ct-dialog-revenue") as HTMLElement | null;

        const updateAll = () => {
          const weights = Array.from(sliders).map((s) => Number(s.value));
          const weightSum = weights.reduce((s, w) => s + w, 0);
          const normalizedRatios = weights.map((w) => weightSum > 0 ? w / weightSum : 0);

          // 비율 표시 업데이트
          normalizedRatios.forEach((r, i) => {
            if (ratioEls[i]) ratioEls[i].textContent = `${Math.round(r * 100)}%`;
          });

          // 매출 계산
          const revenue = calculateWeightedRevenue(salesNum, pv_!.options, normalizedRatios);
          const formatted = formatRevenue(revenue);
          if (revenueEl) revenueEl.textContent = `매출: ${formatted}`;
          if (mainRevenue) mainRevenue.textContent = formatted;
        };

        sliders.forEach((slider) => {
          slider.addEventListener("input", (e) => {
            e.stopPropagation();
            updateAll();
          });
          slider.addEventListener("click", (e) => e.stopPropagation());
          slider.addEventListener("mousedown", (e) => e.stopPropagation());
          slider.addEventListener("pointerdown", (e) => e.stopPropagation());
        });

        // 초기화 버튼
        overlay.querySelector(".ct-opt-reset-btn")!.addEventListener("click", (e) => {
          e.stopPropagation();
          sliders.forEach((s) => {
            const price = Number(s.dataset.price ?? 0);
            s.value = price === pv_!.lowestPrice ? "1" : "0";
          });
          updateAll();
        });
      };
    }
  }

  return true;
}

function formatRevenue(value: number): string {
  if (value >= 100000000) {
    return (
      (value / 100000000)
        .toLocaleString("ko-KR", { maximumFractionDigits: 1 })
        .replace(/\.0$/, "") + "억"
    );
  }
  if (value >= 10000) {
    return (
      (value / 10000)
        .toLocaleString("ko-KR", { maximumFractionDigits: 1 })
        .replace(/\.0$/, "") + "만"
    );
  }
  return value.toLocaleString("ko-KR") + "원";
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
        <span class="kv"><span class="label">⚠️ 상품 데이터가 없습니다</span></span>
      </div>
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
          <button class="login-btn" style="margin-left:12px;background:#1a73e8;color:#fff;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">
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
