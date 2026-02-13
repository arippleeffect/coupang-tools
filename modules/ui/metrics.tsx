import { ProductState } from "@/types";
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
                판매량은 옵션 합산으로만 제공됩니다.<br />옵션별 금액이 달라 정확한 매출 산출이 어렵습니다.
              </span>
            </span>
          )}
          <span className="value chip sales">
            {formatCurrencyKRW(p.data?.totalSales)}
          </span>
        </span>
      </div>
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
