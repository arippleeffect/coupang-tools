export function ErrorToast() {
  return (
    <div
      id="ct-toast"
      className="ct-error"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: 2147483647,
        background: "#8b1d1d",
        color: "#fff",
        padding: "10px 12px",
        borderRadius: "8px",
        boxShadow: "0 4px 16px rgba(0,0,0,.3)",
        font: "13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif",
        opacity: 0.95,
      }}
    >
      <div className="ct-title">요청 실패</div>
      <div className="ct-sub">잠시 후 다시 시도해주세요</div>
    </div>
  );
}
