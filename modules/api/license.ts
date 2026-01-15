import type {
  LicenseActivateRequest,
  LicenseActivateResponse,
  LicenseCheckResponse,
  LicenseInfo,
} from "@/types";

// Mock license keys for development
const MOCK_VALID_LICENSES = [
  {
    email: "test@example.com",
    licenseKey: "TEST-1234-5678-ABCD",
  },
  {
    email: "demo@example.com",
    licenseKey: "DEMO-ABCD-1234-EFGH",
  },
];

/**
 * Mock API: Check license status
 * In production, this would call a real backend API
 */
export async function checkLicense(
  email: string,
  licenseKey: string
): Promise<LicenseCheckResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const isValid = MOCK_VALID_LICENSES.some(
    (license) =>
      license.email === email && license.licenseKey === licenseKey
  );

  if (isValid) {
    return {
      ok: true,
      license: {
        email,
        licenseKey,
        status: "ACTIVE",
        activatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      },
    };
  }

  return {
    ok: false,
    message: "유효하지 않은 라이센스 키입니다.",
  };
}

/**
 * Mock API: Activate license
 * In production, this would call a real backend API
 */
export async function activateLicense(
  request: LicenseActivateRequest
): Promise<LicenseActivateResponse> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const { email, licenseKey, browserId } = request;

  console.log("[License API] Activating license with browserId:", browserId);

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      ok: false,
      message: "올바른 이메일 형식이 아닙니다.",
      error: "INVALID_EMAIL",
    };
  }

  // Validate license key format (XXXX-XXXX-XXXX-XXXX)
  const licenseKeyRegex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  if (!licenseKeyRegex.test(licenseKey)) {
    return {
      ok: false,
      message: "올바른 라이센스 키 형식이 아닙니다. (예: XXXX-XXXX-XXXX-XXXX)",
      error: "INVALID_LICENSE_KEY_FORMAT",
    };
  }

  // Check if license is valid
  const isValid = MOCK_VALID_LICENSES.some(
    (license) =>
      license.email === email && license.licenseKey === licenseKey
  );

  if (!isValid) {
    return {
      ok: false,
      message: "유효하지 않은 라이센스 키입니다. 이메일과 라이센스 키를 확인해주세요.",
      error: "INVALID_LICENSE",
    };
  }

  // Success
  const licenseInfo: LicenseInfo = {
    email,
    licenseKey,
    status: "ACTIVE",
    activatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
    browserId,
  };

  return {
    ok: true,
    license: licenseInfo,
    message: "라이센스가 성공적으로 활성화되었습니다.",
  };
}

/**
 * Mock API: Deactivate license
 * In production, this would call a real backend API
 */
export async function deactivateLicense(
  email: string,
  licenseKey: string
): Promise<{ ok: boolean; message?: string }> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    ok: true,
    message: "라이센스가 비활성화되었습니다.",
  };
}
