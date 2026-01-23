import { getLicense, removeLicense } from "./license-storage";
import type { LicenseInfo } from "@/types";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const VALIDATION_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6시간

let lastValidationTime = 0;
let lastValidationResult = false;

/**
 * 사용자 액션 시 라이센스 유효성 검증 (캐시 사용)
 * @returns 라이센스 유효 여부
 */
export async function validateLicenseOnAction(): Promise<boolean> {
  const now = Date.now();

  if (now - lastValidationTime < VALIDATION_CACHE_DURATION) {
    return lastValidationResult;
  }

  const result = await validateLicense();

  lastValidationTime = now;
  lastValidationResult = result;

  return result;
}

/**
 * 검증 캐시 무효화
 * 라이센스 활성화/비활성화 시 호출하여 즉시 재검증 유도
 */
export function invalidateValidationCache(): void {
  lastValidationTime = 0;
  lastValidationResult = false;
}

/**
 * 백엔드 API를 통한 라이센스 검증
 * @returns 라이센스 유효 여부
 */
async function validateLicense(): Promise<boolean> {
  try {
    const license = await getLicense();

    if (!license) {
      return false;
    }

    const isValid = await callValidationAPI(license);

    if (!isValid) {
      console.warn("[License Validator] License validation failed");
      await removeLicense();
      return false;
    }

    return true;
  } catch (error) {
    console.error("[License Validator] Validation error:", error);
    return false;
  }
}

/**
 * 라이센스 검증 API 호출
 * @param license - 검증할 라이센스 정보
 * @returns API 검증 결과
 */
async function callValidationAPI(license: LicenseInfo): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/license-check`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activationToken: license.activationToken,
      }),
    });

    if (!response.ok) {
      console.error(
        "[License Validator] Validation API request failed:",
        response.status,
      );
      return false;
    }

    const data: { valid: boolean } = await response.json();
    return data.valid || false;
  } catch (error) {
    console.error("[License Validator] Validation API error:", error);
    return false;
  }
}
