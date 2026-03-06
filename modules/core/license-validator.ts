import type { LicenseCheckResult } from "@/types";
import { MESSAGE_TYPE } from "@/types";

/**
 * 사용자 액션 시 라이선스 유효성 검증 (Background에 위임)
 * @returns 라이선스 유효 여부 및 사유
 */
export async function validateLicenseOnAction(): Promise<LicenseCheckResult> {
  try {
    const response = await browser.runtime.sendMessage({
      type: MESSAGE_TYPE.LICENSE_VALIDATE,
    });
    return {
      valid: response?.ok ?? false,
      reason: response?.reason,
      message: response?.message,
    };
  } catch (error) {
    console.error("[License Validator] Failed to validate:", error);
    return { valid: false, reason: "NOT_FOUND" };
  }
}
