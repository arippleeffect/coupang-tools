/**
 * License validation service
 * Periodically validates license with backend API
 */

import { getLicense, removeLicense } from "./license-storage";
import { getBrowserId } from "./browser-id";
import type { LicenseInfo } from "@/types";

// Validation interval: 1 hour (reasonable for license checks)
const VALIDATION_INTERVAL = 60 * 60 * 1000; // 1 hour

// For development/testing: shorter interval
// const VALIDATION_INTERVAL = 2 * 60 * 1000; // 2 minutes

// Cache validation result for 5 minutes to avoid excessive API calls
const VALIDATION_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let lastValidationTime = 0;
let lastValidationResult = false;

// Validation on important actions (with caching)
export async function validateLicenseOnAction(): Promise<boolean> {
  const now = Date.now();

  // Use cached result if validation was done recently (within 5 minutes)
  if (now - lastValidationTime < VALIDATION_CACHE_DURATION) {
    console.log("[License Validator] Using cached validation result:", lastValidationResult);
    return lastValidationResult;
  }

  console.log("[License Validator] Validating license on action");
  const result = await validateLicense();

  // Update cache
  lastValidationTime = now;
  lastValidationResult = result;

  return result;
}

/**
 * Invalidate validation cache
 * Call this when license is activated/deactivated to force revalidation
 */
export function invalidateValidationCache(): void {
  console.log("[License Validator] Cache invalidated");
  lastValidationTime = 0;
  lastValidationResult = false;
}

/**
 * Start periodic license validation
 */
export function startPeriodicValidation(): void {
  console.log("[License Validator] Starting periodic validation (interval: 1 hour)");

  // Validate immediately on start
  validateLicense().then((result) => {
    lastValidationTime = Date.now();
    lastValidationResult = result;
  });

  // Then validate periodically
  setInterval(() => {
    validateLicense().then((result) => {
      lastValidationTime = Date.now();
      lastValidationResult = result;
    });
  }, VALIDATION_INTERVAL);
}

/**
 * Validate license with backend API
 * Returns true if license is valid, false otherwise
 */
async function validateLicense(): Promise<boolean> {
  try {
    const license = await getLicense();

    if (!license) {
      console.log("[License Validator] No license found");
      return false;
    }

    const browserId = await getBrowserId();

    console.log("[License Validator] Validating license", {
      email: license.email,
      browserId,
      storedBrowserId: license.browserId,
    });

    // Check if browser ID matches
    if (license.browserId && license.browserId !== browserId) {
      console.warn(
        "[License Validator] Browser ID mismatch - license deactivated on this browser"
      );
      await removeLicense();
      return false;
    }

    // Call backend API to validate license
    const isValid = await callValidationAPI(license, browserId);

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
 * Call backend API to validate license
 * In production, this would be a real API call
 */
async function callValidationAPI(
  license: LicenseInfo,
  browserId: string
): Promise<boolean> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock validation logic
  // In production, this would call a real backend API
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

  const isValidLicense = MOCK_VALID_LICENSES.some(
    (validLicense) =>
      validLicense.email === license.email &&
      validLicense.licenseKey === license.licenseKey
  );

  if (!isValidLicense) {
    return false;
  }

  // Check expiration
  if (license.expiresAt) {
    const expiresAt = new Date(license.expiresAt);
    if (expiresAt < new Date()) {
      console.log("[License Validator] License expired");
      return false;
    }
  }

  // Check browser ID (simulate backend check)
  // In production, backend would check if this browserId is the active one for this license
  if (license.browserId && license.browserId !== browserId) {
    console.log("[License Validator] Browser ID mismatch on backend");
    return false;
  }

  return true;
}
