type Props = {
  message?: string;
};

export function ErrorToast({ message }: Props) {
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
          animation: "slideIn 0.3s ease-out",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>요청 실패</div>
        {message && <div style={{ opacity: 0.95 }}>{message}</div>}
      </div>
    </>
  );
}
