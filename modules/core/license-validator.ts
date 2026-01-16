import { getLicense, removeLicense } from "./license-storage";
import type { LicenseInfo } from "@/types";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const VALIDATION_INTERVAL = 60 * 60 * 1000;
const VALIDATION_CACHE_DURATION = 5 * 60 * 1000;
let lastValidationTime = 0;
let lastValidationResult = false;

/**
 * 사용자 액션 시 라이센스 유효성 검증 (캐시 사용)
 * @returns 라이센스 유효 여부
 */
export async function validateLicenseOnAction(): Promise<boolean> {
  const now = Date.now();

  if (now - lastValidationTime < VALIDATION_CACHE_DURATION) {
    console.log(
      "[License Validator] Using cached validation result:",
      lastValidationResult
    );
    return lastValidationResult;
  }

  console.log("[License Validator] Validating license on action");
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
  console.log("[License Validator] Cache invalidated");
  lastValidationTime = 0;
  lastValidationResult = false;
}

/**
 * 주기적 라이센스 검증 시작 (1시간 간격)
 */
export function startPeriodicValidation(): void {
  console.log(
    "[License Validator] Starting periodic validation (interval: 1 hour)"
  );

  validateLicense().then((result) => {
    lastValidationTime = Date.now();
    lastValidationResult = result;
  });

  setInterval(() => {
    validateLicense().then((result) => {
      lastValidationTime = Date.now();
      lastValidationResult = result;
    });
  }, VALIDATION_INTERVAL);
}

/**
 * 백엔드 API를 통한 라이센스 검증
 * @returns 라이센스 유효 여부
 */
async function validateLicense(): Promise<boolean> {
  try {
    const license = await getLicense();

    if (!license) {
      console.log("[License Validator] No license found");
      return false;
    }

    console.log("[License Validator] Validating license", {
      email: license.email,
    });

    const isValid = await callValidationAPI(license);

    if (!isValid) {
      console.warn("[License Validator] License validation failed");
      await removeLicense();
      return false;
    }

    console.log("[License Validator] License is valid");
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
        response.status
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
