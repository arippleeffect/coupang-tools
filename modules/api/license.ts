import type {
  LicenseActivateRequest,
  LicenseActivateResponse,
  LicenseDeactivateRequest,
  LicenseDeactivateResponse,
  LicenseInfo,
} from "@/types";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * 라이센스 활성화
 * @param request - 이메일과 라이센스 키를 포함하는 활성화 요청
 * @returns 활성화 결과 및 라이센스 정보
 */
export async function activateLicense(
  request: LicenseActivateRequest,
): Promise<LicenseActivateResponse> {
  const { email, licenseKey } = request;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      ok: false,
      message: "올바른 이메일 형식이 아닙니다.",
      error: "INVALID_EMAIL",
    };
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/licenses-register`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          licenseKey,
        }),
      },
    );

    if (!response.ok) {
      let errorMessage = "라이센스 활성화 요청 실패";
      let errorCode = "REQUEST_FAILED";

      try {
        const errorData = await response.json();

        if (response.status === 404) {
          errorMessage =
            errorData.error ||
            "라이센스를 찾을 수 없습니다. 이메일과 라이센스 키를 확인해주세요.";
          errorCode = "LICENSE_NOT_FOUND";
        } else if (response.status === 400) {
          errorMessage = errorData.error || "라이센스 업데이트에 실패했습니다.";
          errorCode = "UPDATE_FAILED";
        } else {
          errorMessage = errorData.error || errorMessage;
        }

        console.error("[License API] Error details:", errorData);
      } catch (parseError) {
        console.error(
          "[License API] Failed to parse error response:",
          parseError,
        );
      }

      return {
        ok: false,
        message: errorMessage,
        error: errorCode,
      };
    }

    const data: { success: boolean; activation_token?: string } =
      await response.json();

    if (!data.success || !data.activation_token) {
      return {
        ok: false,
        message:
          "유효하지 않은 라이센스 키입니다. 이메일과 라이센스 키를 확인해주세요.",
        error: "INVALID_LICENSE",
      };
    }

    const licenseInfo: LicenseInfo = {
      email,
      activationToken: data.activation_token,
      status: "ACTIVE",
      activatedAt: new Date().toISOString(),
    };

    return {
      ok: true,
      license: licenseInfo,
      message: "라이센스가 성공적으로 활성화되었습니다.",
    };
  } catch (fetchError) {
    console.error("[License API] Network error:", fetchError);
    return {
      ok: false,
      message: "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.",
      error: "NETWORK_ERROR",
    };
  }
}

/**
 * 라이센스 비활성화
 * @param request - 활성화 토큰을 포함하는 비활성화 요청
 * @returns 비활성화 결과
 */
export async function deactivateLicense(
  request: LicenseDeactivateRequest,
): Promise<LicenseDeactivateResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    ok: true,
    message: "라이센스가 비활성화되었습니다.",
  };
}
