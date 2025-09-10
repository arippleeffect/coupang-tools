import * as XLSX from "xlsx";
import { renderErrorToast } from "@/modlues/ui/toastRenderer";
import * as ReactDOM from "react-dom/client";
const rootMap = new WeakMap<HTMLElement, ReactDOM.Root>();
import { Complete, Empty, Fail, Loading } from "@/modlues/ui/metrics";
import Banner from "@/modlues/ui/banner";
import { MESSAGE_TYPE } from "@/types";

let bannerUi: any = null;
let currentProducts: ProductState[] = [];

function exportProductsToExcel(products: ProductState[]) {
  const normalRows = products
    .filter((p) => p.status === "COMPLETE")
    .filter((p) => p.type === "NORMAL")
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      status: p.status,
      brandName: p.data?.brandName ?? "",
      pv: p.data?.pv ?? "",
      sales: p.data?.sales ?? "",
      rate: p.data?.rate ?? "",
    }));

  const adRows = products
    .filter((p) => p.status === "COMPLETE")
    .filter((p) => p.type === "AD")
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      status: p.status,
      brandName: p.data?.brandName ?? "",
      pv: p.data?.pv ?? "",
      sales: p.data?.sales ?? "",
      rate: p.data?.rate ?? "",
    }));

  console.log("normalRows::", normalRows);

  const wb = XLSX.utils.book_new();
  if (normalRows.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(normalRows),
      "일반상품"
    );
  }
  if (adRows.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(adRows),
      "광고상품"
    );
  }

  const xlsxArray = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });
  const blob = new Blob([xlsxArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  a.download = `products_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(
    ts.getDate()
  )}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.xlsx`;
  a.href = url;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function setupProductsBanner(ctx: any, products: ProductState[]) {
  // ✅ products 없으면 배너 제거 후 리턴
  if (products.length === 0) {
    if (bannerUi) {
      bannerUi.remove();
      bannerUi = null;
    }
    return products;
  }

  currentProducts = products;

  if (!bannerUi) {
    bannerUi = createIntegratedUi(ctx, {
      anchor: "body",
      position: "overlay",
      onMount(container) {
        // ✅ rootMap을 이용해 createRoot 중복 방지
        let root = rootMap.get(container);
        if (!root) {
          root = ReactDOM.createRoot(container);
          rootMap.set(container, root);
        }
        root.render(
          Banner({
            count: currentProducts.filter(
              (p) => p.status === "COMPLETE" && p.data
            ).length,
            onDownloadExcel: () => exportProductsToExcel(currentProducts),
          })
        );
      },
    });
  }

  updateBanner();

  return new Proxy(products, {
    set(target, prop, value) {
      (target as any)[prop] = value;
      updateBanner();
      return true;
    },
    get(target, prop, receiver) {
      const v = Reflect.get(target, prop, receiver);
      const mutationMethods = [
        "push",
        "pop",
        "shift",
        "unshift",
        "splice",
        "sort",
        "reverse",
        "copyWithin",
        "fill",
      ];
      if (typeof v === "function" && mutationMethods.includes(prop as string)) {
        return function (...args: any[]) {
          const result = v.apply(target, args);
          updateBanner();
          return result;
        };
      }
      return v;
    },
  });
}

function updateBanner() {
  if (!bannerUi) return;
  const products = currentProducts;
  const completeCount = products.filter(
    (p) => p.status === "COMPLETE" && p.data
  ).length;
  if (products.length > 0) {
    if (!bannerUi.mounted) {
      bannerUi.mount();
    } else {
      let root = rootMap.get(bannerUi.wrapper);
      if (!root) {
        root = ReactDOM.createRoot(bannerUi.wrapper);
        rootMap.set(bannerUi.wrapper, root);
      }
      root.render(
        Banner({
          count: completeCount,
          onDownloadExcel: () => exportProductsToExcel(products),
        })
      );
    }
  } else {
    bannerUi.remove();
  }
}

function ensureToast() {
  if (document.getElementById("ct-toast")) return;
  const styleId = "ct-toast-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #ct-toast{position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#111;color:#fff;padding:10px 12px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3);font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;opacity:.95}
      #ct-toast .ct-title{font-weight:600;margin-bottom:4px}
      #ct-toast .ct-sub{opacity:.85}
      #ct-toast .ct-bar{height:3px;background:#2ecc71;margin-top:8px;border-radius:2px;transform-origin:left;transform:scaleX(0)}
      #ct-toast.ct-error{background:#8b1d1d}
    `;
    document.head.appendChild(style);
  }
  const wrap = document.createElement("div");
  wrap.id = "ct-toast";
  wrap.style.width = "200px"; // 원하는 너비
  wrap.style.height = "80px"; // 원하는 높이
  wrap.style.boxSizing = "border-box";
  wrap.style.overflow = "hidden";
  wrap.innerHTML = `
    <div class="ct-title">수집 진행 중…</div>
    <div class="ct-sub">수집: <span id="ct-count">0</span> / <span id="ct-total">0</span>개</div>
    <div class="ct-bar" id="ct-bar"></div>
  `;
  document.body.appendChild(wrap);
}
function updateToast(count: number, currentSize: number, totalSize: number) {
  ensureToast();
  const c = document.getElementById("ct-count");
  const total = document.getElementById("ct-total");
  const bar = document.getElementById("ct-bar") as HTMLDivElement | null;
  if (c) c.textContent = String(count);
  if (total) total.textContent = String(totalSize);
  if (bar) {
    const ratio = Math.max(0, Math.min(1, currentSize / totalSize)); // unknown total; show subtle motion
    bar.style.transform = `scaleX(${ratio || 0.1})`;
  }
}
function finishToast(ok: boolean, finalCount: number) {
  ensureToast();
  const t = document.getElementById("ct-toast");
  if (!t) return;
  if (!ok) t.classList.add("ct-error");
  const title = t.querySelector(".ct-title");
  const sub = t.querySelector(".ct-sub");
  if (title) title.textContent = ok ? "수집 완료" : "수집 중단";
  if (sub) sub.textContent = `총 ${finalCount}개`;
  const bar = document.getElementById("ct-bar");
  if (bar) (bar as HTMLDivElement).style.transform = "scaleX(1)";
  setTimeout(() => t.remove(), 2500);
}

function ensureMetricsStyle() {
  const styleId = "ct-metrics-style";
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    .ct-metrics{display:block;max-width:100%;z-index:auto;pointer-events:none}
    .ct-metrics .wrap{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;background:rgba(28,28,30,.82);box-shadow:0 8px 24px rgba(0,0,0,.25);color:#fff;backdrop-filter:saturate(140%) blur(10px);-webkit-backdrop-filter:saturate(140%) blur(10px);border:1px solid rgba(255,255,255,.12)}
    .ct-metrics .metric{display:flex;gap:8px;justify-content:space-between;align-items:baseline;font-size:12px;line-height:1.5}
    .ct-metrics .label{opacity:.8}
    .ct-metrics .value{font-weight:700;letter-spacing:-.01em}
    .ct-metrics .value.rate{font-variant-numeric:tabular-nums}
    .ct-metrics .chip{display:inline-block;padding:2px 8px;border-radius:9999px;font-weight:700;font-size:11px;line-height:1.3}
    .ct-metrics .chip.pv{background:rgba(0,122,255,.35);color:#fff;border:1px solid rgba(0,122,255,.6);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-metrics .chip.sales{background:rgba(255,149,0,.34);color:#fff;border:1px solid rgba(255,149,0,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-metrics .chip.rate{background:rgba(52,199,89,.32);color:#fff;border:1px solid rgba(52,199,89,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-metrics .retry-btn{pointer-events:auto;position:relative;z-index:10;background:#2b6eff;color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border:none;border-radius:6px;cursor:pointer}
    .ct-metrics .retry-btn:hover{background:#1f54c7}
    .ct-metrics .loading{display:flex;align-items:center;justify-content:center}
    .ct-metrics .spinner{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:ctspin .8s linear infinite}
    @keyframes ctspin{to{transform:rotate(360deg)}}
    @media (prefers-color-scheme: light){
      .ct-metrics .wrap{background:rgba(20,20,20,.82);}
      .ct-metrics .chip.pv{background:rgba(0,122,255,.14);color:#0a84ff;border:1px solid rgba(0,122,255,.35);text-shadow:none}
      .ct-metrics .chip.sales{background:rgba(255,149,0,.16);color:#ff9500;border:1px solid rgba(255,149,0,.35);text-shadow:none}
      .ct-metrics .chip.rate{background:rgba(52,199,89,.16);color:#34c759;border:1px solid rgba(52,199,89,.35);text-shadow:none}
    }
    .ProductUnit_productUnit__Qd6sv > a{display:flex;flex-direction:column}
    .ProductUnit_productUnit__Qd6sv > a > .ct-metrics{margin-top:auto}
  `;
  document.head.appendChild(style);
}

function ensureHelloStyle() {
  const id = "ct-hello-style";
  if (document.getElementById(id)) return;
  const style = document.createElement("style");
  style.id = id;
  style.textContent = `
    .ct-hello{position:fixed;top:16px;right:16px;z-index:2147483646;padding:10px 14px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.18);color:#fff;font-weight:700;font-size:14px;line-height:1.2;pointer-events:none}
    .ct-hello.blue{background:linear-gradient(135deg,#4f86ff,#2b6eff)}
    .ct-hello.local{position:absolute;top:0;right:0;transform:translateY(-110%);pointer-events:none}
    .ct-hello.inline{position:static;display:block;margin:8px 0 12px auto;max-width:max-content;pointer-events:auto}
    .ct-prodinfo{position:static;display:block;margin:10px 0 14px 0;max-width:100%;pointer-events:auto}
    .ct-prodinfo .wrap{display:flex;flex-wrap:wrap;gap:10px;padding:12px 14px;border-radius:12px;background:rgba(28,28,30,.86);color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.22);backdrop-filter:saturate(140%) blur(10px);-webkit-backdrop-filter:saturate(140%) blur(10px);border:1px solid rgba(255,255,255,.12)}
    .ct-prodinfo .row{display:flex;gap:8px;justify-content:space-between;align-items:baseline;width:100%;font-size:13px;line-height:1.5}
    .ct-prodinfo .label{opacity:.85}
    .ct-prodinfo .value{font-weight:700;letter-spacing:-.01em}
    .ct-prodinfo .chip{display:inline-block;padding:3px 10px;border-radius:9999px;font-weight:700;font-size:12px;line-height:1.25;border:1px solid transparent}
    .ct-prodinfo .chip.pv{background:rgba(0,122,255,.35);color:#fff;border-color:rgba(0,122,255,.6);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-prodinfo .chip.sales{background:rgba(255,149,0,.34);color:#fff;border-color:rgba(255,149,0,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-prodinfo .chip.rate{background:rgba(52,199,89,.32);color:#fff;border-color:rgba(52,199,89,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-prodinfo .sub{width:100%;text-align:right;font-size:11px;opacity:.75;margin-top:2px}
    .ct-prodinfo.compact .wrap{padding:8px 10px;gap:6px}
    .ct-prodinfo.compact .line{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
    .ct-prodinfo.compact .kv{display:inline-flex;gap:6px;align-items:baseline;font-size:12px;line-height:1.35}
    .ct-prodinfo.compact .kv .label{opacity:.8}
    .ct-prodinfo.compact .sep{opacity:.4}
    @media (prefers-color-scheme: light){
      .ct-prodinfo .wrap{background:rgba(20,20,20,.84)}
      .ct-prodinfo .chip.pv{background:rgba(0,122,255,.14);color:#0a84ff;border-color:rgba(0,122,255,.35);text-shadow:none}
      .ct-prodinfo .chip.sales{background:rgba(255,149,0,.16);color:#ff9500;border-color:rgba(255,149,0,.35);text-shadow:none}
      .ct-prodinfo .chip.rate{background:rgba(52,199,89,.16);color:#34c759;border-color:rgba(52,199,89,.35);text-shadow:none}
    }
  `;
  document.head.appendChild(style);
}

function injectHelloBannerAfterHeader(text: string = "안녕하세요") {
  ensureHelloStyle();
  const root = document.querySelector(
    ".prod-atf-contents"
  ) as HTMLElement | null;
  if (!root) return false;
  if (root.querySelector(".ct-hello.inline")) return true;

  const el = document.createElement("div");
  el.className = "ct-hello blue inline";
  el.textContent = text;

  const first = root.firstElementChild as HTMLElement | null; // e.g., .product-buy-header
  if (first) {
    first.insertAdjacentElement("afterend", el);
  } else {
    root.prepend(el);
  }
  return true;
}

function injectProductInfoAfterHeader(info: {
  productId: string;
  brandName?: string;
  pvLast28Day?: number;
  salesLast28d?: number;
  rateText?: string;
}) {
  ensureHelloStyle();
  const root = document.querySelector(
    ".prod-atf-contents"
  ) as HTMLElement | null;
  if (!root) return false;

  // remove existing banner to avoid duplicates
  const prev = root.querySelector(".ct-prodinfo");
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

  el.innerHTML = `
    <div class="wrap">
      <div class="line">
        <span class="kv"><span class="label">노출상품ID</span><span class="value">${
          info.productId
        }</span></span>
        <span class="sep">·</span>
        <span class="kv"><span class="label">브랜드</span><span class="value">${brand}</span></span>
        <span class="sep">·</span>
        <span class="kv"><span class="label">조회</span><span class="value chip pv">${fmtInt(
          pv
        )}</span></span>
        <span class="kv"><span class="label">판매</span><span class="value chip sales">${fmtInt(
          sales
        )}</span></span>
        <span class="kv"><span class="label">전환</span><span class="value chip rate">${rate}</span></span>
      </div>
      <div class="sub">최근 28일 기준</div>
    </div>`;

  const first = root.firstElementChild as HTMLElement | null; // header
  if (first) first.insertAdjacentElement("afterend", el);
  else root.prepend(el);
  return true;
}

function debounce<T extends (...args: any[]) => void>(fn: T, wait = 150) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

function waitForElement(selector: string, timeout = 8000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);
    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    if (timeout > 0)
      setTimeout(() => {
        obs.disconnect();
        reject(new Error(`waitForElement timeout: ${selector}`));
      }, timeout);
  });
}
function getPidFromLocation(): string | null {
  const m =
    location.pathname.match(/\/products\/(\d+)/) ||
    location.href.match(/\/products\/(\d+)/);
  return m ? m[1] : null;
}

async function fetchAndInjectProductInfo(pid: string) {
  let resp: any = null;
  try {
    resp = await browser.runtime.sendMessage({
      type: MESSAGE_TYPE.GET_PRODUCT,
      keyword: pid,
    });
  } catch {
    resp = null;
  }

  if (!resp.ok) {
    return;
  }

  const retryResult = (resp.data?.result as CoupangProduct[]) || [];
  const matched = retryResult.find((r) => String(r.productId) === String(pid));
  console.log("matched::", matched);

  const rateText =
    matched &&
    Number(matched.pvLast28Day) > 0 &&
    isFinite(Number(matched.salesLast28d))
      ? (
          (Number(matched.salesLast28d) / Number(matched.pvLast28Day)) *
          100
        ).toFixed(2) + "%"
      : "-";

  injectProductInfoAfterHeader({
    productId: String(pid),
    brandName: matched?.brandName,
    pvLast28Day: matched?.pvLast28Day,
    salesLast28d: matched?.salesLast28d,
    rateText,
  });
}

function setupLazyProductInfo() {
  const exec = async () => {
    const pid = getPidFromLocation();
    if (!pid) return;
    try {
      await waitForElement(".prod-atf-contents", 12000);
    } catch {}
    fetchAndInjectProductInfo(pid);

    // Keep it persistent: re-inject if DOM re-renders
    const root = document.querySelector(".prod-atf-contents");
    if (!root) return;
    const ensure = debounce(() => {
      const banner = root.querySelector(".ct-prodinfo");
      const curPid = getPidFromLocation();
      if (!banner && curPid) fetchAndInjectProductInfo(curPid);
    }, 150);
    const mo = new MutationObserver(() => ensure());
    mo.observe(root, { childList: true, subtree: true });

    // React to SPA navigations
    const reMount = () =>
      setTimeout(() => {
        const npid = getPidFromLocation();
        if (npid) fetchAndInjectProductInfo(npid);
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

function isCoupangProductUrl(href: string) {
  try {
    const u = new URL(href, location.origin);
    return /\/vp\/products\/\d+/.test(u.pathname);
  } catch {
    return false;
  }
}

const getCookieValue = (key: string): string => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`))
      ?.split("=")[1] || ""
  );
};

const fetchItemList = async ({
  pageSize,
  pageIndex,
  token,
}: {
  pageSize: number;
  pageIndex: number;
  token: string;
}): Promise<Response> => {
  return fetch(
    "https://wing.coupang.com/tenants/rfm/goldfish/vendor-return/itemList",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        "x-xsrf-token": decodeURIComponent(token),
      },
      referrer:
        "https://wing.coupang.com/tenants/rfm/goldfish/vendor-return/creation",
      body: JSON.stringify({ pageSize, pageIndex }),
      method: "POST",
      credentials: "include",
    }
  );
};

async function collectItems(pageSize: number): Promise<any[]> {
  const results: any[] = [];
  let pageIndex = 0;

  while (true) {
    const token = getCookieValue("XSRF-TOKEN");
    try {
      const res = await fetchItemList({ pageSize, pageIndex, token });

      if (!res.ok) {
        finishToast(false, results.length);
        break;
      }

      const data = await res.json();
      const items = Array.isArray(data?.content) ? data.content : [];

      if (!items.length) {
        finishToast(true, results.length);
        break;
      }

      results.push(...items);
      updateToast(results.length, results.length, data.totalElements);

      if (items.length < pageSize) {
        finishToast(true, results.length);
        break;
      }

      // 다음 페이지로 증가
      pageIndex += 1;
    } catch (e) {
      console.warn("요청 중 예외 발생 - 중단합니다.", e);
      finishToast(false, results.length);
      break;
    }
  }
  return results;
}

// 쿠팡윙 creation2.js에 위치함
const fcCodesToMerge = new Set([
  "SFSCH1",
  "INC20",
  "SFAYG10",
  "SFNYJ2",
  "SFCHJ1",
  "SFNHN1",
  "SFISN5",
  "SFGWJ1",
  "SFWBS2",
  "SFGMP1",
  "SFISN1",
  "SFBSN5",
  "SFDJN2",
  "SFNYJ3",
  "SFYAT1",
  "SFJEJ1",
  "SFNGH2",
  "SFWDG1",
  "SFBUC3",
  "SFCHA1",
  "SFGNP1",
  "SFDJN3",
]);

const isRepresentativeFcCode = (t: string) =>
  t.startsWith("XRC") || t.startsWith("CHA9");
type ProductStatus = "LOADING" | "COMPLETE" | "FAIL" | "EMPTY";
type ProductType = "NORMAL" | "AD";
type ProductData = {
  brandName: string;
  pv: number;
  sales: number;
  rate: string;
};
export type ProductState = {
  dataId: string;
  productName: string;
  productId: string;
  status: ProductStatus;
  type: ProductType;
  data?: ProductData;
};

type CoupangProduct = {
  productId: number;
  productName: string;
  brandName: string;
  itemId: number;
  itemName: string;
  displayCategoryInfo: {
    leafCategoryCode: number;
    rootCategoryCode: number;
    categoryHierarchy: string;
  }[];
  manufacture: string;
  categoryId: number;
  itemCountOfProduct: number;
  imagePath: string;
  matchType: string | null;
  salePrice: number;
  vendorItemId: number;
  ratingCount: number;
  rating: number;
  sponsored: string | null;
  matchingResultId: string | null;
  pvLast28Day: number;
  salesLast28d: number;
  deliveryMethod: string;
  attributeTypes: string | null;
};

export default defineContentScript({
  matches: ["https://wing.coupang.com/*", "https://www.coupang.com/*"],
  main(ctx) {
    (async () => {
      if (isCoupangProductUrl(location.href)) {
        setupLazyProductInfo();
      }
    })();

    let products: ProductState[] = [];
    browser.runtime.onMessage.addListener(async (msg) => {
      if (msg.type === MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL) {
        ensureToast();
        const pageSize = 50;
        const results = await collectItems(pageSize);

        const filteredList = results.map((item) => {
          if (
            !Object.keys(item.returnableQtyByFCTotal).some((g) =>
              fcCodesToMerge.has(g)
            )
          ) {
            return item;
          }

          let primaryFcCode: string | null = null;
          for (const fcCode in item.returnableQtyByFCTotal) {
            if (isRepresentativeFcCode(fcCode)) {
              primaryFcCode = fcCode;
              break;
            }
          }

          if (!primaryFcCode) {
            primaryFcCode = "CHA9";
            item.returnableQtyByFCTotal[primaryFcCode] = {
              qty: 0,
              fcName: "CHA9",
            };
          }

          Object.keys(item.returnableQtyByFCTotal)
            .filter((g) => fcCodesToMerge.has(g))
            .forEach((g) => {
              const W = item.returnableQtyByFCTotal[g];
              item.returnableQtyByFCTotal[primaryFcCode!].qty += W?.qty ?? 0;
            });

          Object.keys(item.returnableQtyByFCTotal)
            .filter((g) => fcCodesToMerge.has(g))
            .forEach((g) => {
              delete item.returnableQtyByFCTotal[g];
            });

          return item;
        });

        try {
          const rows: any[] = [];
          const safe = (v: any) => (v == null ? "" : String(v));

          for (const it of filteredList) {
            const fcMap = it?.returnableQtyByFCTotal || {};

            const entries = Object.entries(fcMap) as [string, any][];

            if (entries.length === 0) {
              rows.push({
                vendorItemId: safe(it.vendorItemId),
                vendorInventoryId: safe(it.vendorInventoryId),
                vendorInventoryName: safe(it.vendorInventoryName),
                vendorInventoryItemName: safe(it.vendorInventoryItemName),
                vendorId: safe(it.vendorId),
                skuId: safe(it.skuId),
                productId: safe(it.productId),
                imageUrl: safe(
                  it.imageUrl ||
                    (it.mainImageEndPoint
                      ? `https://image1.coupangcdn.com/image/${it.mainImageEndPoint}`
                      : "")
                ),
                fcCode: "",
                fcName: "",
                qty: "",
                returnableQtyTotal: safe(it.returnableQtyTotal),
              });
            } else {
              for (const [fcCode, v] of entries) {
                const qty = v?.qty ?? "";
                const fcName = v?.fcName ?? "";
                rows.push({
                  vendorItemId: safe(it.vendorItemId),
                  vendorInventoryId: safe(it.vendorInventoryId),
                  vendorInventoryName: safe(it.vendorInventoryName),
                  vendorInventoryItemName: safe(it.vendorInventoryItemName),
                  vendorId: safe(it.vendorId),
                  skuId: safe(it.skuId),
                  productId: safe(it.productId),
                  imageUrl: safe(
                    it.imageUrl ||
                      (it.mainImageEndPoint
                        ? `https://image1.coupangcdn.com/image/${it.mainImageEndPoint}`
                        : "")
                  ),
                  fcCode: safe(fcCode),
                  fcName: safe(fcName),
                  qty: safe(qty),
                  returnableQtyTotal: safe(it.returnableQtyTotal),
                });
              }
            }
          }

          const headers = [
            "vendorItemId",
            "vendorInventoryId",
            "vendorInventoryName",
            "vendorInventoryItemName",
            "vendorId",
            "skuId",
            "productId",
            "imageUrl",
            "fcCode",
            "fcName",
            "qty",
            "returnableQtyTotal",
          ];

          const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
          const colWidths = headers.map((h) => ({
            wch: Math.min(
              60,
              Math.max(
                String(h).length + 2,
                ...rows.map((r) => String((r as any)[h] ?? "").length + 2)
              )
            ),
          }));
          (ws as any)["!cols"] = colWidths;

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "반출목록");

          const xlsxArray = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          const blob = new Blob([xlsxArray], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const ts = new Date();
          const pad = (n: number) => String(n).padStart(2, "0");
          const fname = `vendor-return_${ts.getFullYear()}${pad(
            ts.getMonth() + 1
          )}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(
            ts.getMinutes()
          )}${pad(ts.getSeconds())}.xlsx`;
          a.href = url;
          a.download = fname;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("CSV 다운로드 중 오류", e);
        }

        return;
      }

      if (msg.type === MESSAGE_TYPE.EXCEL_DOWNLOAD_BANNER_INIT) {
        document.querySelectorAll(".ct-metrics").forEach((el) => el.remove());
        products = [];
        bannerUi.remove();
        bannerUi = null;
        return;
      }

      if (msg.type === MESSAGE_TYPE.VIEW_PRODUCT_METRICS) {
        const productListElement = document.getElementById("product-list");
        if (!productListElement) {
          throw new Error("제품 리스트가 없습니다.");
        }
        try {
          const liTagsElement = productListElement.getElementsByTagName("li");
          products = liElementsToProducts(liTagsElement);

          // TODO: 다른데 뺄 수 있는지 확인해보기
          setupProductsBanner(ctx, products);

          ensureMetricsStyle();
          products.forEach((p) => {
            renderProductBox(p, products);
          });

          // 첫번째 요청 불러오기
          const q = new URL(location.href).searchParams.get("q");
          const response = await browser.runtime.sendMessage({
            type: MESSAGE_TYPE.GET_PRODUCT,
            keyword: q,
          });
          console.log("response", response);

          if (!response.ok) {
            products.forEach((item) => {
              const el = document.querySelector<HTMLElement>(
                `[data-id="${item.dataId}"] .ct-metrics`
              );
              if (el) el.remove();
            });
            renderErrorToast(ctx).mount();
            return;
          }

          const result = response.data.result as CoupangProduct[];

          products.forEach((p) => {
            if (!p.productId || !p.dataId) return;
            const matched = result.find(
              (r) => String(r.productId) === String(p.productId)
            );

            console.log("matched::", matched);
            if (matched) {
              setProductState(p.dataId, (st) => {
                st.status = "COMPLETE";
                st.productName = matched.productName;
                st.data = {
                  brandName: matched.brandName,
                  pv: matched.pvLast28Day,
                  sales: matched.salesLast28d,
                  rate:
                    matched.pvLast28Day > 0
                      ? (
                          (matched.salesLast28d / matched.pvLast28Day) *
                          100
                        ).toFixed(2) + "%"
                      : "-",
                };
              });
            } else {
              setProductState(p.dataId, (st) => {
                st.status = "FAIL";
              });
            }
          });

          // 이부분 변경해야함
          const noDataStates = products.filter(
            (item) => item.status === "FAIL" || item.status === undefined
          );

          noDataStates.forEach(async (p) => {
            if (!p.dataId) {
              return;
            }

            setProductState(p.dataId, (st) => {
              st.status = "LOADING";
              st.data = undefined;
            });

            try {
              const retryResp = await browser.runtime.sendMessage({
                type: MESSAGE_TYPE.GET_PRODUCT,
                keyword: p.productId,
              });

              if (retryResp.ok) {
                const retryResult =
                  (retryResp.data?.result as CoupangProduct[]) || [];

                const matched = retryResult.find(
                  (r) => String(r.productId) === String(p.productId)
                );

                if (matched) {
                  setProductState(p.dataId, (st) => {
                    st.status = "COMPLETE";
                    st.productName = matched.productName;
                    st.data = {
                      brandName: matched.brandName,
                      pv: matched.pvLast28Day,
                      sales: matched.salesLast28d,
                      rate:
                        matched.pvLast28Day > 0
                          ? (
                              (matched.salesLast28d / matched.pvLast28Day) *
                              100
                            ).toFixed(2) + "%"
                          : "-",
                    };
                  });
                } else {
                  setProductState(p.dataId, (st) => {
                    st.status = "EMPTY";
                  });
                }
              } else {
                setProductState(p.dataId, (st) => {
                  st.status = "FAIL";
                });
              }
            } catch (e) {
              console.warn("Retry request failed for", p.productId, e);
              setProductState(p.dataId, (st) => {
                st.status = "FAIL";
              });
            }
          });

          return;
        } finally {
          // bottom-right toast will close when all tasks finished (finishToast)
        }
      }
    });
  },
});

function liElementsToProducts(
  list: HTMLCollectionOf<HTMLLIElement>
): ProductState[] {
  return Array.from(list).reduce<ProductState[]>((acc, el) => {
    const dataId = el.dataset.id;
    const aTag = el.children[0]?.getAttribute?.("href");
    const match = aTag && aTag.match(/products\/(\d+)/);
    const productId = match ? match[1] : undefined;
    const type: ProductType = el.querySelector(".AdMark_adMark__KPMsC")
      ? "AD"
      : "NORMAL";
    const productName =
      el
        .querySelector<HTMLElement>(".ProductUnit_productName__gre7e")
        ?.textContent?.trim() ?? "";

    if (typeof dataId === "string" && typeof productId === "string") {
      acc.push({
        dataId,
        productId,
        productName,
        status: "LOADING",
        type,
        data: undefined,
      });
    }
    return acc;
  }, []);
}

// els외부로 뺴기

function renderProductBox(pState: ProductState, products: ProductState[]) {
  const elements = document.querySelectorAll<HTMLElement>(
    `[data-id="${pState.dataId}"]`
  );

  const elementList = Array.from(elements);

  const missingMetricBoxes = elementList.filter(
    (el) => !el.querySelector<HTMLElement>(".ct-metrics")
  );

  // 박스가 없는경우 추가
  missingMetricBoxes.forEach((el) => {
    const newBox = document.createElement("div");
    newBox.className = "ct-metrics";
    const aTag = el.querySelector("a");
    aTag ? aTag.appendChild(newBox) : el.appendChild(newBox);
  });

  const handleRetry = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    const dataId = event.currentTarget.getAttribute("data-dataid");
    if (!dataId) return;

    const product = products.find((p) => p.dataId === dataId);
    if (!product) return;
    try {
      updateAndRenderProduct(product, (p) => {
        p.status = "LOADING";
        p.data = undefined;
        return p;
      });

      const retryResponse = await browser.runtime.sendMessage({
        type: MESSAGE_TYPE.GET_PRODUCT,
        keyword: product.productId,
      });

      if (!retryResponse.ok) {
        updateAndRenderProduct(product, (p) => {
          p.status = "FAIL";
          return p;
        });
        // TODO :updateBanner필요
        return;
      }

      const retryResult =
        (retryResponse.data?.result as CoupangProduct[]) || [];
      const matched = retryResult.find(
        (r) => String(r.productId) === String(product.productId)
      );

      if (!matched) {
        updateAndRenderProduct(product, (p) => {
          p.status = "EMPTY";
          return p;
        });
        return;
      }

      updateAndRenderProduct(product, (p) => {
        p.status = "EMPTY";
        p.productName = matched.productName;
        p.data = {
          ...p.data,
          brandName: matched.productName,
          pv: matched.pvLast28Day,
          sales: matched.salesLast28d,
          rate:
            matched.pvLast28Day > 0
              ? ((matched.salesLast28d / matched.pvLast28Day) * 100).toFixed(
                  2
                ) + "%"
              : "-",
        };
        return p;
      });
    } catch (e) {
      // 사이드 이팩트
      updateAndRenderProduct(product, (p) => {
        p.status = "EMPTY";
        return p;
      });
    }
  };

  // 렌더링

  elementList.forEach((el) => {
    const box = el.querySelector<HTMLElement>(".ct-metrics");
    if (!box) {
      return;
    }

    const root = ReactDOM.createRoot(box);
    switch (pState.status) {
      case "LOADING":
        root.render(Loading());
        break;
      case "COMPLETE":
        root.render(Complete({ p: pState }));
        break;
      case "FAIL":
        root.render(Fail({ dataId: pState.dataId, onRetry: handleRetry }));
        break;
      case "EMPTY":
      default:
        root.render(Empty());
        break;
    }
  });
}

// 리스너 달아서 적용?
const updateAndRenderProduct = (
  product: ProductState,
  updater: (product: ProductState) => ProductState
) => {
  if (!product) return;
  const updatedProduct = { ...product, ...updater(product) };
  // renderProductBox(updatedProduct);
};

// function setProductState(dataId: string, updater: (st: ProductState) => void) {
//   const st = products.find((item) => item.dataId === dataId);
//   if (!st) return;
//   updater(st);
//   renderProductBox(st);
//   updateBanner();
// }
