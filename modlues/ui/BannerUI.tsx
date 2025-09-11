// modules/ui/Banner.tsx
export function Banner({ count }: { count: number }) {
  return (
    <div
      id="ct-product-banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        padding: "10px 14px",
        background: "rgba(43,110,255,0.85)",
        color: "#fff",
        fontWeight: 600,
        fontSize: "14px",
        backdropFilter: "saturate(140%) blur(8px)",
        borderBottomLeftRadius: "8px",
        borderBottomRightRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>상품 {count}개 발견됨</span>
      <button
        id="ct-export-btn"
        style={{
          marginLeft: "auto",
          background: "#fff",
          color: "#2b6eff",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        엑셀 다운로드
      </button>
    </div>
  );
}
