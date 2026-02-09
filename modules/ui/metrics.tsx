import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ProductState } from "@/types";
import { calculateWeightedRevenue } from "@/modules/features/price-validation";
import "./metrics.css"; // 스타일 직접 불러오기

export function formatCurrencyKRW(value?: number): string {
  if (value == null || isNaN(value)) return "-";
  if (value >= 100000000)
    return (
      (value / 100000000)
        .toLocaleString("ko-KR", { maximumFractionDigits: 1 })
        .replace(/\.0$/, "") + "억"
    );
  if (value >= 10000)
    return (
      (value / 10000)
        .toLocaleString("ko-KR", { maximumFractionDigits: 1 })
        .replace(/\.0$/, "") + "만"
    );
  return value.toLocaleString("ko-KR") + "원";
}

export function Loading() {
  return (
    <div className="wrap" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} onDragStart={(e) => e.preventDefault()} draggable={false}>
      <div className="metric">
        <span className="spinner"></span>
        <span className="label">로딩중</span>
      </div>
    </div>
  );
}

export function Complete({ p }: { p: ProductState }) {
  const pv = p.data?.priceValidation;
  const hasWarning = pv?.hasPriceDifference === true;
  const [expanded, setExpanded] = useState(false);
  const [weights, setWeights] = useState<number[]>(() => {
    if (!pv?.options) return [];
    return pv.options.map((o) => (o.salePrice === pv.lowestPrice ? 1 : 0));
  });

  useEffect(() => {
    if (!pv?.options) return;
    setWeights(pv.options.map((o) => (o.salePrice === pv.lowestPrice ? 1 : 0)));
  }, [pv?.options?.length, pv?.lowestPrice]);

  const weightSum = weights.reduce((s, w) => s + w, 0);
  const normalizedRatios = weights.map((w) =>
    weightSum > 0 ? w / weightSum : 0,
  );

  const weightedRevenue =
    hasWarning && pv && p.data
      ? calculateWeightedRevenue(
          p.data.sales,
          pv.options,
          normalizedRatios,
        )
      : p.data?.totalSales;

  const handleSlider = (idx: number, val: number) => {
    setWeights((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const handleReset = () => {
    if (!pv?.options) return;
    setWeights(pv.options.map((o) => (o.salePrice === pv.lowestPrice ? 1 : 0)));
  };

  const fmtPrice = (n: number) => n.toLocaleString("ko-KR") + "원";

  return (
    <div className="wrap" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} onDragStart={(e) => e.preventDefault()} draggable={false}>
      <div className="metric">
        <span className="label">노출상품ID</span>
        <span className="value">{p.productId}</span>
      </div>
      <div className="metric">
        <span className="label">옵션ID</span>
        <span className="value">{p.itemId ?? ""}</span>
      </div>
      <div className="metric">
        <span className="label">브랜드</span>
        <span className="value">{p.data?.brandName ?? ""}</span>
      </div>
      <div className="metric">
        <span className="label">조회수</span>
        <span className="value chip pv">{p.data?.pv.toLocaleString()}</span>
      </div>
      <div className="metric">
        <span className="label">판매량</span>
        <span className="value chip sales">
          {p.data?.sales.toLocaleString()}
        </span>
      </div>
      <div className="metric">
        <span className="label">전환율</span>
        <span className="value chip rate">{p.data?.rate}</span>
      </div>
      <div className="metric">
        <span className="label">매출</span>
        <span className="ct-metric-value-group">
          {hasWarning && (
            <span className="ct-price-warn-icon">
              ⚠
              <span className="ct-warn-tooltip">
                옵션별 금액이 달라 정확한 매출 산출이 어렵습니다. 비율을 설정하여 매출을 추정할 수 있습니다.
              </span>
            </span>
          )}
          <span className="value chip sales">
            {formatCurrencyKRW(weightedRevenue)}
          </span>
        </span>
      </div>
      {hasWarning && (
        <button
          className="ct-opt-toggle-btn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(true);
          }}
        >
          옵션별 판매 비율 설정
        </button>
      )}
      {hasWarning && expanded && pv && createPortal(
        <div
          className="ct-dialog-overlay"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setExpanded(false);
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            className="ct-dialog"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
          >
            <div className="ct-dialog-header">
              <span>옵션별 판매 비율 설정</span>
              <button
                className="ct-dialog-close"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setExpanded(false);
                }}
              >
                ✕
              </button>
            </div>
            <div className="ct-dialog-desc">
              옵션별 개별 판매량은 확인할 수 없고 합산된 판매량만 제공됩니다. 옵션별 금액이 다를 경우 정확한 매출 산출이 어려우므로, 예상 판매 비율을 설정하여 매출을 추정할 수 있습니다.
            </div>
            <div className="ct-dialog-body">
              {pv.options.map((opt, i) => (
                <div className="ct-dialog-row" key={i}>
                  <div className="ct-dialog-opt-info">
                    <span className="ct-dialog-opt-name">
                      {opt.optionName || `옵션 ${i + 1}`}
                    </span>
                    <span className="ct-dialog-opt-price">
                      {fmtPrice(opt.salePrice)}
                      {opt.salePrice === pv.lowestPrice ? " (최저)" : ""}
                    </span>
                  </div>
                  <div className="ct-dialog-opt-control">
                    <input
                      type="range"
                      className="ct-opt-slider"
                      min={0}
                      max={1}
                      step={0.01}
                      value={weights[i] ?? 0}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSlider(i, Number(e.target.value));
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    />
                    <span className="ct-opt-ratio">
                      {weightSum > 0
                        ? Math.round(normalizedRatios[i] * 100)
                        : 0}%
                    </span>
                  </div>
                  {opt.productUrl && (
                    <a
                      href={opt.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ct-opt-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      링크
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="ct-dialog-footer">
              <span className="ct-dialog-revenue">
                매출: {formatCurrencyKRW(weightedRevenue)}
              </span>
              <button
                className="ct-opt-reset-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleReset();
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export function Fail({
  dataId,
  onRetry,
}: {
  dataId: string;
  onRetry?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => Promise<void>;
}) {
  return (
    <div className="wrap" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} onDragStart={(e) => e.preventDefault()} draggable={false}>
      <div className="metric">
        <button
          className="retry-btn w-full"
          style={{
            width: "100%",
          }}
          data-dataid={dataId}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onRetry) {
              onRetry(e);
            }
          }}
        >
          재시도 ↻
        </button>
      </div>
    </div>
  );
}

export function Empty() {
  return (
    <div className="wrap" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} onDragStart={(e) => e.preventDefault()} draggable={false}>
      <div className="metric">
        <span className="label">데이터 없음</span>
      </div>
    </div>
  );
}
