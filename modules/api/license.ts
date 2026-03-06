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
 * 라이선스 활성화
 * @param request - 이메일, 라이선스 키, deviceId를 포함하는 활성화 요청
 * @returns 활성화 결과 및 라이선스 정보
 */
export async function activateLicense(
  request: LicenseActivateRequest,
): Promise<LicenseActivateResponse> {
  const { email, licenseKey, deviceId, confirm: confirmed } = request;

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
      `${SUPABASE_URL}/functions/v1/activate-license`,
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
          deviceId,
          ...(confirmed && { confirm: true }),
        }),
      },
    );

    if (!response.ok) {
      let errorMessage = "라이선스 활성화 요청 실패";
      let errorCode = "REQUEST_FAILED";

      try {
        const errorData = await response.json();

        if (response.status === 404) {
          errorMessage =
            errorData.message ||
            "라이선스를 찾을 수 없습니다. 이메일과 라이선스 키를 확인해주세요.";
          errorCode = "LICENSE_NOT_FOUND";
        } else if (response.status === 403) {
          errorMessage =
            errorData.message ||
            "라이선스가 일시 중지되었습니다. 고객센터에 문의해주세요.";
          errorCode = errorData.error || "LICENSE_SUSPENDED";
        } else if (response.status === 400) {
          errorMessage = errorData.message || "라이선스 업데이트에 실패했습니다.";
          errorCode = "UPDATE_FAILED";
        } else {
          errorMessage = errorData.message || errorMessage;
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

    const data: {
      success: boolean;
      error?: string;
      message?: string;
      activation_token?: string;
      deviceChangeCount?: number;
      maxAllowed?: number;
      warning?: {
        type: string;
        message: string;
        deviceChangeCount: number;
        maxAllowed: number;
      };
    } = await response.json();

    // 기기 변경 확인 필요
    if (!data.success && data.error === "DEVICE_CHANGE_CONFIRM") {
      return {
        ok: false,
        error: "DEVICE_CHANGE_CONFIRM",
        message: "다른 기기에서 이미 활성화되어 있습니다. 현재 기기로 변경하시겠습니까? 비정상적인 기기 변경이 반복될 경우 라이선스가 영구 정지될 수 있습니다.",
        deviceChangeCount: data.deviceChangeCount,
        maxAllowed: data.maxAllowed,
      };
    }

    if (!data.success || !data.activation_token) {
      return {
        ok: false,
        message:
          "유효하지 않은 라이선스 키입니다. 이메일과 라이선스 키를 확인해주세요.",
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
      message: "라이선스가 성공적으로 활성화되었습니다.",
      warning: data.warning
        ? { ...data.warning, message: "기기가 변경되었습니다. 다음부터는 기존 기기에서 먼저 라이선스를 비활성화한 후 새 기기에서 활성화해 주세요." }
        : undefined,
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
 * 라이선스 비활성화 (서버에 실제 요청)
 * @param request - activationToken과 deviceId를 포함하는 비활성화 요청
 * @returns 비활성화 결과
 */
export async function deactivateLicense(
  request: LicenseDeactivateRequest,
): Promise<LicenseDeactivateResponse> {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/deactivate-license`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activationToken: request.activationToken,
          deviceId: request.deviceId,
        }),
      },
    );

    if (!response.ok) {
      let errorMessage = "라이선스 비활성화에 실패했습니다.";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // ignore parse error
      }
      return { ok: false, message: errorMessage, error: "DEACTIVATE_FAILED" };
    }

    const data = await response.json();
    return {
      ok: true,
      message: data.message || "라이선스가 비활성화되었습니다.",
    };
  } catch (error) {
    console.error("[License API] Deactivate network error:", error);
    return {
      ok: false,
      message: "네트워크 오류가 발생했습니다.",
      error: "NETWORK_ERROR",
    };
  }
}
