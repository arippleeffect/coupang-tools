import { useState, useEffect } from "react";
import "./App.css";
import { getLicense } from "@/modules/core/license-storage";
import type { LicenseInfo } from "@/types";
import { MESSAGE_TYPE } from "@/types";

function App() {
  const [loading, setLoading] = useState(true);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [hasValidLicense, setHasValidLicense] = useState(false);

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  async function checkLicenseStatus() {
    try {
      const licenseData = await getLicense();

      if (!licenseData) {
        setHasValidLicense(false);
        setLicense(null);
        return;
      }

      // 서버에 라이선스 유효성 검증
      const result = await browser.runtime.sendMessage({
        type: MESSAGE_TYPE.LICENSE_VALIDATE,
      });

      setHasValidLicense(result.ok);
      setLicense(result.ok ? licenseData : null);
    } catch (error) {
      console.error("Failed to check license:", error);
      setHasValidLicense(false);
    } finally {
      setLoading(false);
    }
  }

  function openLicensePage() {
    const licensePageUrl = browser.runtime.getURL("/license.html");
    browser.tabs.create({ url: licensePageUrl });
    window.close();
  }

  async function handleLogout() {
    if (
      !confirm(
        "로그아웃하시겠습니까?\n\n다른 기기에서 로그인할 수 있습니다.",
      )
    ) {
      return;
    }

    try {
      const response = await browser.runtime.sendMessage({
        type: MESSAGE_TYPE.LICENSE_DEACTIVATE,
      });

      if (response.ok) {
        await checkLicenseStatus();
      } else {
        alert(response.message || "로그아웃에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to logout:", error);
      alert("로그아웃에 실패했습니다.");
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <div className="header-icon">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <h1>쿠팡 지표 분석</h1>
          <p>상품 데이터 및 판매 지표</p>
        </div>
        <div className="loading">
          <div className="spinner"></div>
          <div className="loading-text">로딩 중...</div>
        </div>
      </div>
    );
  }

  if (!hasValidLicense) {
    return (
      <div className="app">
        <div className="header">
          <div className="header-icon">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <h1>쿠팡 지표 분석</h1>
          <p>상품 데이터 및 판매 지표</p>
        </div>
        <div className="content">
          <div className="no-license">
            <div className="no-license-icon">
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2>라이선스 활성화 필요</h2>
            <p>
              이 도구를 사용하려면 라이선스 활성화가 필요합니다.
              <br />
              구매하신 라이선스 키를 입력해주세요.
            </p>
            <button className="btn btn-primary" onClick={openLicensePage}>
              라이선스 활성화
            </button>
          </div>
        </div>
        <div className="footer">v1.0 © 2026 쿠팡 지표 분석</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <div className="header-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </div>
        <h1>쿠팡 지표 분석</h1>
        <p>상품 분석 및 지표 확인</p>
      </div>
      <div className="content">
        <div className="license-info">
          <h2>라이선스 정보</h2>
          <div className="info-row">
            <span className="info-label">상태</span>
            <span
              className={`status-badge ${
                license?.status === "ACTIVE"
                  ? "status-active"
                  : "status-inactive"
              }`}
            >
              {license?.status === "ACTIVE" ? "활성" : "비활성"}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">이메일</span>
            <span className="info-value">{license?.email || "-"}</span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={openLicensePage}>
          라이선스 키 변경
        </button>
        <button className="btn btn-danger" onClick={handleLogout}>
          로그아웃
        </button>
      </div>
      <div className="footer">v1.0 © 2026 쿠팡 지표 분석</div>
    </div>
  );
}

export default App;
