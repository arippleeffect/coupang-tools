import * as ReactDOM from "react-dom/client";
import { Complete, Empty, Fail, Loading } from "@/modules/ui/metrics";
import { ErrorBoundary } from "@/modules/ui/error-boundary";
import type { ProductState } from "@/types";
import { SELECTORS } from "@/modules/constants/selectors";

const rootMap = new WeakMap<HTMLElement, ReactDOM.Root>();

export function renderProductBox(
  pState: ProductState,
  onRetry: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => Promise<void>,
) {
  const elements = document.querySelectorAll<HTMLElement>(
    `[data-id="${pState.dataId}"]`,
  );

  const elementList = Array.from(elements);

  const missingMetricBoxes = elementList.filter(
    (el) => !el.querySelector<HTMLElement>(SELECTORS.CT_METRICS),
  );

  missingMetricBoxes.forEach((el) => {
    const newBox = document.createElement("div");
    newBox.className = SELECTORS.CT_METRICS.slice(1);

    // pointerdown 시 부모 <a> 태그의 dragstart와 click을 일시적으로 차단
    newBox.addEventListener("pointerdown", () => {
      const parentAnchor = newBox.closest("a");
      if (!parentAnchor) return;

      const preventDrag = (evt: Event) => evt.preventDefault();
      parentAnchor.addEventListener("dragstart", preventDrag, { once: true });

      const preventClick = (evt: Event) => {
        const target = evt.target as HTMLElement;
        // 옵션 링크는 정상 동작 허용
        if (target.closest("a.ct-opt-link")) {
          return;
        }
        // 버튼/입력은 부모 <a> 이동만 차단, React 이벤트는 허용
        if (target.closest("button, input, .retry-btn")) {
          evt.preventDefault();
          return;
        }
        // 나머지는 완전 차단
        evt.preventDefault();
        evt.stopImmediatePropagation();
      };

      const cleanup = () => {
        parentAnchor.removeEventListener("dragstart", preventDrag);
        // pointerup 직후 발생하는 click 이벤트를 capture 단계에서 차단
        parentAnchor.addEventListener("click", preventClick, {
          capture: true,
          once: true,
        });
        // click이 발생하지 않을 경우를 대비해 100ms 후 정리
        setTimeout(() => {
          parentAnchor.removeEventListener("click", preventClick, {
            capture: true,
          });
        }, 100);
      };
      window.addEventListener("pointerup", cleanup, { once: true });
    });

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
    .ct-metrics .wrap{position:relative;display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;background:rgba(28,28,30,.82);box-shadow:0 8px 24px rgba(0,0,0,.25);color:#fff;backdrop-filter:saturate(140%) blur(10px);-webkit-backdrop-filter:saturate(140%) blur(10px);border:1px solid rgba(255,255,255,.12);pointer-events:auto;cursor:default;overflow:visible}
    .ct-metrics .metric{display:flex;gap:8px;justify-content:space-between;align-items:baseline;font-size:12px;line-height:1.5}
    .ct-metrics .label{opacity:.8}
    .ct-metrics .value{font-weight:700;letter-spacing:-.01em}
    .ct-metrics .value.rate{font-variant-numeric:tabular-nums}
    .ct-metrics .chip{display:inline-block;padding:2px 8px;border-radius:9999px;font-weight:700;font-size:11px;line-height:1.3}
    .ct-metrics .chip.pv{background:rgba(0,122,255,.35);color:#fff;border:1px solid rgba(0,122,255,.6);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-metrics .chip.sales{background:rgba(255,149,0,.34);color:#fff;border:1px solid rgba(255,149,0,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-metrics .chip.rate{background:rgba(52,199,89,.32);color:#fff;border:1px solid rgba(52,199,89,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-metrics .ct-metric-value-group{display:flex;align-items:baseline;gap:0}
    .ct-metrics .ct-price-warn-icon{z-index:999999;color:#ff3b30;cursor:help;font-size:13px;margin-right:4px;pointer-events:auto}
    .ct-warn-tooltip{display:none;position:absolute;bottom:78px;left:0;right:0;padding:10px 12px;background:rgba(100,15,15,.95);border:1px solid rgba(255,59,48,.55);color:#ffb3b3;z-index:999999;box-sizing:border-box;font-size:12px;font-weight:500;line-height:1.5;white-space:normal;border-radius:8px;pointer-events:none}
    .ct-warn-tooltip::before{content:"";position:absolute;top:100%;right:48px;border:7px solid transparent;border-top-color:rgba(255,59,48,.55)}
    .ct-warn-tooltip::after{content:"";position:absolute;top:100%;right:49px;border:6px solid transparent;border-top-color:rgba(100,15,15,.95)}
    .ct-metrics .ct-price-warn-icon:hover .ct-warn-tooltip{display:block}
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
