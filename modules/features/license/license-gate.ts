import { isLicenseValid } from "@/modules/core/license-storage";

/**
 * 라이센스 유효성 확인 및 활성화 페이지로 리디렉션
 * @returns 라이센스 유효 여부
 */
export async function checkLicenseAndRedirect(): Promise<boolean> {
  const isValid = await isLicenseValid();

  if (!isValid) {
    const licensePageUrl = browser.runtime.getURL("/license.html");
    window.open(licensePageUrl, "_blank", "width=600,height=700");
    return false;
  }

  return true;
}

/**
 * 라이센스 필요 UI 오버레이 표시
 */
export function showLicenseRequiredOverlay(): void {
  if (document.getElementById("ct-license-overlay")) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "ct-license-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(8px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 450px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin-bottom: 20px;
      ">🔐</div>
      <h2 style="
        font-size: 24px;
        color: #1a1a1a;
        margin-bottom: 12px;
        font-weight: 600;
      ">라이센스 활성화 필요</h2>
      <p style="
        font-size: 15px;
        color: #666;
        line-height: 1.6;
        margin-bottom: 24px;
      ">
        이 기능을 사용하려면 라이센스 활성화가 필요합니다.<br>
        구매하신 라이센스 키를 입력해주세요.
      </p>
      <button id="ct-activate-license-btn" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 12px;
        width: 100%;
      ">라이센스 활성화</button>
      <button id="ct-close-overlay-btn" style="
        background: #f5f5f5;
        color: #666;
        border: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
      ">닫기</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const activateBtn = document.getElementById("ct-activate-license-btn");
  const closeBtn = document.getElementById("ct-close-overlay-btn");

  if (activateBtn) {
    activateBtn.addEventListener("click", () => {
      const licensePageUrl = browser.runtime.getURL("/license.html");
      window.open(licensePageUrl, "_blank", "width=600,height=700");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });
  }

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });
}

/**
 * 라이센스 필요 오버레이 제거
 */
export function removeLicenseRequiredOverlay(): void {
  const overlay = document.getElementById("ct-license-overlay");
  if (overlay) {
    overlay.remove();
  }
}
