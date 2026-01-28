import { MESSAGE_TYPE } from "@/types";

/**
 * 사용자 액션 시 라이선스 유효성 검증 (Background에서 캐시 관리)
 * Content script에서 호출 시 background로 메시지를 보내 검증
 * @returns 라이선스 유효 여부
 */
export async function validateLicenseOnAction(): Promise<boolean> {
  try {
    const response = await browser.runtime.sendMessage({
      type: MESSAGE_TYPE.LICENSE_VALIDATE,
    });
    return response?.ok ?? false;
  } catch (error) {
    console.error("[License Validator] Failed to validate:", error);
    return false;
  }
}

/**
 * 검증 캐시 무효화 (Background에 요청)
 * @deprecated Background에서 직접 invalidateValidationCache() 호출
 */
export function invalidateValidationCache(): void {
  // Background에서만 호출됨 - 이 함수는 하위 호환성을 위해 유지
  console.warn("[License Validator] invalidateValidationCache should be called from background");
}
