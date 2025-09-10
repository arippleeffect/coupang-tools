import { ProductState } from "@/entrypoints/content";
import "./metrics.css"; // 스타일 직접 불러오기

export function Loading() {
  return (
    <div className="wrap">
      <div className="metric loading">
        <span className="spinner"></span>
      </div>
    </div>
  );
}

export function Complete({ p }: { p: ProductState }) {
  return (
    <div className="wrap">
      <div className="metric">
        <span className="label">노출상품ID</span>
        <span className="value">{p.productId}</span>
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
        <span className="label">전환률</span>
        <span className="value chip rate">{p.data?.rate}</span>
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
    <div className="wrap">
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
    <div className="wrap">
      <div className="metric">
        <span className="label">데이터 없음</span>
      </div>
    </div>
  );
}
