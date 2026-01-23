import * as ReactDOM from "react-dom/client";
import { LoginToast } from "@/modules/ui/login-toast";
import { ErrorBoundary } from "@/modules/ui/error-boundary";

let loginToastContainer: HTMLDivElement | null = null;
let loginToastRoot: ReactDOM.Root | null = null;

export function showLoginToast() {
  hideLoginToast();

  loginToastContainer = document.createElement("div");
  loginToastContainer.id = "ct-login-toast-container";
  document.body.appendChild(loginToastContainer);

  loginToastRoot = ReactDOM.createRoot(loginToastContainer);
  loginToastRoot.render(
    <ErrorBoundary>
      <LoginToast
        onOpenLogin={() => {
          window.open("https://wing.coupang.com/login", "_blank");
          hideLoginToast();
        }}
      />
    </ErrorBoundary>,
  );

  setTimeout(() => {
    hideLoginToast();
  }, 10000);
}

export function hideLoginToast() {
  if (loginToastRoot) {
    loginToastRoot.unmount();
    loginToastRoot = null;
  }
  if (loginToastContainer) {
    loginToastContainer.remove();
    loginToastContainer = null;
  }
}

export function isLoginRequiredError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message || error.error || "";
  const errorCode = error.code || "";

  const result =
    errorCode === "NO_XSRF_TOKEN" ||
    errorMessage.includes("쿠팡윙로그인") ||
    errorMessage.includes("로그인");

  return result;
}
