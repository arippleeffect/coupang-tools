import { useEffect } from "react";

type Props = {
  message?: string;
  code?: string;
};

export function ErrorToast({ message, code }: Props) {
  const isNoProductList = code === "NO_PRODUCT_LIST";

  useEffect(() => {
    if (isNoProductList) {
      const searchInput = document.querySelector<HTMLInputElement>(
        'input.headerSearchKeyword, input[name="q"]'
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: "smooth", block: "center" });

        // 툴팁 생성
        const tooltip = document.createElement("div");
        tooltip.id = "ct-search-tooltip";
        tooltip.innerHTML = "검색어를 입력하세요";
        tooltip.style.cssText = `
          position: absolute;
          background: #d32f2f;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          z-index: 2147483647;
          animation: tooltipBounce 0.5s ease-out;
          white-space: nowrap;
        `;

        // 애니메이션 스타일 추가
        const style = document.createElement("style");
        style.textContent = `
          @keyframes tooltipBounce {
            0% { transform: translateY(-10px); opacity: 0; }
            50% { transform: translateY(3px); }
            100% { transform: translateY(0); opacity: 1; }
          }
          #ct-search-tooltip::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 16px;
            border: 6px solid transparent;
            border-top-color: #d32f2f;
          }
        `;
        document.head.appendChild(style);

        // 위치 설정 - 인풋 왼쪽에 맞춤
        const rect = searchInput.getBoundingClientRect();
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.top + window.scrollY - 40}px`;

        document.body.appendChild(tooltip);

        // 5초 후 툴팁 제거
        setTimeout(() => {
          tooltip.remove();
          style.remove();
        }, 5000);
      }
    }
  }, [isNoProductList]);

  return (
    <>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
      <div
        id="ct-toast"
        className="ct-error"
        style={{
          position: "fixed",
          right: "20px",
          bottom: "20px",
          zIndex: 2147483647,
          background: "#d32f2f",
          color: "#fff",
          padding: "16px 20px",
          borderRadius: "12px",
          boxShadow: "0 4px 16px rgba(0,0,0,.3)",
          fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif",
          fontSize: "14px",
          lineHeight: "1.5",
          minWidth: "300px",
          maxWidth: "400px",
          animation: "slideIn 0.15s ease-out",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>
          {isNoProductList ? "지원하지 않는 페이지" : "요청 실패"}
        </div>
        {isNoProductList ? (
          <>
            <div style={{ opacity: 0.95, marginBottom: "8px" }}>
              다음 페이지에서만 사용할 수 있습니다:
            </div>
            <ul style={{ margin: 0, paddingLeft: "18px", opacity: 0.95 }}>
              <li>검색어 입력 결과 페이지</li>
              <li>카테고리 검색 페이지</li>
              <li>브랜드샵 전체상품 페이지</li>
            </ul>
          </>
        ) : (
          message && <div style={{ opacity: 0.95 }}>{message}</div>
        )}
      </div>
    </>
  );
}
