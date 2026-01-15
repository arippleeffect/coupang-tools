import { useState, useEffect } from "react";
import "./App.css";
import {
  getLicense,
  isLicenseValid,
  removeLicense,
} from "@/modules/core/license-storage";
import type { LicenseInfo } from "@/types";

function App() {
  const [loading, setLoading] = useState(true);
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [hasValidLicense, setHasValidLicense] = useState(false);

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  async function checkLicenseStatus() {
    try {
      const isValid = await isLicenseValid();
      const licenseData = await getLicense();

      setHasValidLicense(isValid);
      setLicense(licenseData);
    } catch (error) {
      console.error("Failed to check license:", error);
    } finally {
      setLoading(false);
    }
  }

  function openLicensePage() {
    const licensePageUrl = browser.runtime.getURL("/license.html");
    browser.tabs.create({ url: licensePageUrl });
    window.close();
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function handleRemoveLicense() {
    if (
      !confirm(
        "라이센스를 삭제하시겠습니까?\n\n삭제 후 다시 활성화하려면 라이센스 키를 재입력해야 합니다."
      )
    ) {
      return;
    }

    try {
      await removeLicense();
      // Refresh status
      await checkLicenseStatus();
    } catch (error) {
      console.error("Failed to remove license:", error);
      alert("라이센스 삭제에 실패했습니다.");
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="header">
          <h1>쿠팡 스탯 체크</h1>
          <p>상품 분석 및 지표 확인</p>
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
          <h1>쿠팡 스탯 체크</h1>
          <p>상품 분석 및 지표 확인</p>
        </div>
        <div className="content">
          <div className="no-license">
            <div className="no-license-icon">🔐</div>
            <h2>라이센스 활성화 필요</h2>
            <p>
              이 도구를 사용하려면 라이센스 활성화가 필요합니다.
              <br />
              구매하신 라이센스 키를 입력해주세요.
            </p>
            <button className="btn btn-primary" onClick={openLicensePage}>
              라이센스 활성화
            </button>
          </div>
        </div>
        <div className="footer">v1.0 © 2026 쿠팡 스탯 체크</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <h1>쿠팡 스탯 체크</h1>
        <p>상품 분석 및 지표 확인</p>
      </div>
      <div className="content">
        <div className="license-info">
          <h2>라이센스 정보</h2>
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
          <div className="info-row">
            <span className="info-label">만료일</span>
            <span className="info-value">
              {license?.expiresAt ? formatDate(license.expiresAt) : "무제한"}
            </span>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={openLicensePage}>
          라이센스 키 변경
        </button>
        <button className="btn btn-danger" onClick={handleRemoveLicense}>
          라이센스 삭제
        </button>
      </div>
      <div className="footer">v1.0 © 2026 쿠팡 스탯 체크</div>
    </div>
  );
}

export default App;
