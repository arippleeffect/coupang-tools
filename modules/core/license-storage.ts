import type { LicenseInfo } from "@/types";

const LICENSE_STORAGE_KEY = "ct_license";

/**
 * 라이센스 정보 저장
 * @param license - 저장할 라이센스 정보
 */
export async function saveLicense(license: LicenseInfo): Promise<void> {
  await browser.storage.local.set({
    [LICENSE_STORAGE_KEY]: license,
  });
}

/**
 * 저장된 라이센스 정보 조회
 * @returns 라이센스 정보 또는 null
 */
export async function getLicense(): Promise<LicenseInfo | null> {
  const result = await browser.storage.local.get(LICENSE_STORAGE_KEY);
  return result[LICENSE_STORAGE_KEY] || null;
}

/**
 * 저장된 라이센스 정보 삭제
 */
export async function removeLicense(): Promise<void> {
  await browser.storage.local.remove(LICENSE_STORAGE_KEY);
}

/**
 * 라이센스 유효성 확인
 * 라이센스 존재 여부 및 활성 상태 검증
 * @returns 라이센스 유효 여부
 */
export async function isLicenseValid(): Promise<boolean> {
  const license = await getLicense();

  if (!license) {
    return false;
  }

  if (license.status !== "ACTIVE") {
    return false;
  }

  return true;
}
