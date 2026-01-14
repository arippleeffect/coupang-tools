/**
 * Login Handler
 *
 * Handles login-required scenarios
 */

import * as ReactDOM from 'react-dom/client';
import { LoginToast } from '@/modules/ui/login-toast';
import { ErrorBoundary } from '@/modules/ui/error-boundary';

let loginToastContainer: HTMLDivElement | null = null;
let loginToastRoot: ReactDOM.Root | null = null;

/**
 * Show login required toast
 */
export function showLoginToast() {
  // Remove existing toast if any
  hideLoginToast();

  // Create container
  loginToastContainer = document.createElement('div');
  loginToastContainer.id = 'ct-login-toast-container';
  document.body.appendChild(loginToastContainer);

  // Create root and render
  loginToastRoot = ReactDOM.createRoot(loginToastContainer);
  loginToastRoot.render(
    <ErrorBoundary>
      <LoginToast
        onOpenLogin={() => {
          window.open('https://wing.coupang.com/login', '_blank');
          hideLoginToast();
        }}
      />
    </ErrorBoundary>
  );

  // Auto-hide after 10 seconds
  setTimeout(() => {
    hideLoginToast();
  }, 10000);
}

/**
 * Hide login toast
 */
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

/**
 * Check if error is login-required error
 */
export function isLoginRequiredError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message || error.error || '';
  const errorCode = error.code || '';

  console.log('[isLoginRequiredError] Checking error:', {
    error,
    errorCode,
    errorMessage,
  });

  const result =
    errorCode === 'NO_XSRF_TOKEN' ||
    errorMessage.includes('쿠팡윙로그인') ||
    errorMessage.includes('로그인');

  console.log('[isLoginRequiredError] Result:', result);

  return result;
}
