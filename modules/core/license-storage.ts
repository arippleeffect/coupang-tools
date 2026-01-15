import type { LicenseInfo } from "@/types";

const LICENSE_STORAGE_KEY = "ct_license";

/**
 * Save license info to storage
 */
export async function saveLicense(license: LicenseInfo): Promise<void> {
  await browser.storage.local.set({
    [LICENSE_STORAGE_KEY]: license,
  });
}

/**
 * Get license info from storage
 */
export async function getLicense(): Promise<LicenseInfo | null> {
  const result = await browser.storage.local.get(LICENSE_STORAGE_KEY);
  return result[LICENSE_STORAGE_KEY] || null;
}

/**
 * Remove license info from storage
 */
export async function removeLicense(): Promise<void> {
  await browser.storage.local.remove(LICENSE_STORAGE_KEY);
}

/**
 * Check if license is valid
 * - Check if license exists
 * - Check if license is not expired
 */
export async function isLicenseValid(): Promise<boolean> {
  const license = await getLicense();

  if (!license) {
    return false;
  }

  if (license.status !== "ACTIVE") {
    return false;
  }

  // Check expiration
  if (license.expiresAt) {
    const expiresAt = new Date(license.expiresAt);
    if (expiresAt < new Date()) {
      return false;
    }
  }

  return true;
}
