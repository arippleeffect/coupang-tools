let toastTimeout: NodeJS.Timeout | null = null;

export function showErrorToast(message: string) {
  hideErrorToast();

  const toast = document.createElement("div");
  toast.id = "ct-product-info-error-toast";
  toast.style.cssText = `
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 2147483647;
    background: #d32f2f;
    color: #fff;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0,0,0,.3);
    font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
    font-size: 14px;
    line-height: 1.5;
    min-width: 300px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

  toast.innerHTML = `
    <div style="font-weight: 700; font-size: 15px; margin-bottom: 8px;">요청 실패</div>
    <div style="opacity: 0.95;">${escapeHtml(message)}</div>
  `;

  if (!document.getElementById("ct-toast-animation-style")) {
    const style = document.createElement("style");
    style.id = "ct-toast-animation-style";
    style.textContent = `
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
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  toastTimeout = setTimeout(() => {
    hideErrorToast();
  }, 4000);
}

export function hideErrorToast() {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
    toastTimeout = null;
  }

  const toast = document.getElementById("ct-product-info-error-toast");
  if (toast) {
    toast.remove();
  }
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
