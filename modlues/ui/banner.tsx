export default function Banner({
  count,
  onDownloadExcel,
}: {
  count: number;
  onDownloadExcel: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
}) {
  return (
    <div
      id="ct-product-banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2147483647,
        padding: "6px 2px",
        background: "rgba(43,110,255)",
        color: "#fff",
        fontWeight: 600,
        fontSize: "13px",
        backdropFilter: "saturate(140%) blur(8px)",
        boxShadow: "0 4px 12px rgba(0,0,0,.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>상품 지표 다운로드 {count}개 </span>
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
        onClick={onDownloadExcel}
      >
        엑셀 다운로드
      </button>
    </div>
  );
}
