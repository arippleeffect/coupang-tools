import * as ReactDOM from "react-dom/client";
import { Complete, Empty, Fail, Loading } from "@/modules/ui/metrics";
import { ErrorBoundary } from "@/modules/ui/error-boundary";
import type { ProductState } from "@/types";
import { SELECTORS } from "@/modules/constants/selectors";

const rootMap = new WeakMap<HTMLElement, ReactDOM.Root>();

export function renderProductBox(
  pState: ProductState,
  onRetry: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => Promise<void>
) {
  const elements = document.querySelectorAll<HTMLElement>(
    `[data-id="${pState.dataId}"]`
  );

  const elementList = Array.from(elements);

  const missingMetricBoxes = elementList.filter(
    (el) => !el.querySelector<HTMLElement>(SELECTORS.CT_METRICS)
  );

  missingMetricBoxes.forEach((el) => {
    const newBox = document.createElement("div");
    newBox.className = SELECTORS.CT_METRICS.slice(1);

    if (
      el.classList.contains("product-wrap") ||
      el.classList.contains("product-wrapper")
    ) {
      const descWrapper =
        el.querySelector(".info-wrapper-desc") ||
        el.querySelector(".product-wrapper") ||
        el.querySelector(".product-info") ||
        el.querySelector(".product-desc") ||
        el.querySelector(".desc");

      if (descWrapper) {
        descWrapper.appendChild(newBox);
        return;
      }

      const anchor = el.querySelector('a[href*="/products/"]');
      if (anchor) {
        anchor.appendChild(newBox);
        return;
      }

      el.appendChild(newBox);
      return;
    }

    const aTag = el.querySelector("a");
    aTag ? aTag.appendChild(newBox) : el.appendChild(newBox);
  });

  elementList.forEach((el) => {
    const box = el.querySelector<HTMLElement>(SELECTORS.CT_METRICS);
    if (!box) return;

    let root = rootMap.get(box);
    if (!root) {
      root = ReactDOM.createRoot(box);
      rootMap.set(box, root);
    }

    const renderContent = () => {
      console.log("pState", pState.status);
      switch (pState.status) {
        case "LOADING":
          return <Loading />;
        case "COMPLETE":
          return <Complete p={pState} />;
        case "FAIL":
          return <Fail dataId={pState.dataId} onRetry={onRetry} />;
        case "EMPTY":
          return <Empty />;
        default:
          return <Empty />;
      }
    };

    root.render(<ErrorBoundary>{renderContent()}</ErrorBoundary>);
  });
}

export function initMetricsStyle() {
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
