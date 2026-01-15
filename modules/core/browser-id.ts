/**
 * Browser ID management
 * Generates and stores a unique browser identifier
 */

const BROWSER_ID_KEY = "ct_browser_id";

/**
 * Generate a unique browser ID
 */
function generateBrowserId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}${random2}`;
}

/**
 * Get or create browser ID
 * If browser ID doesn't exist, create a new one
 */
export async function getBrowserId(): Promise<string> {
  const result = await browser.storage.local.get(BROWSER_ID_KEY);
  console.log("result", result);
  let browserId = result[BROWSER_ID_KEY];

  if (!browserId) {
    browserId = generateBrowserId();
    await browser.storage.local.set({ [BROWSER_ID_KEY]: browserId });
    console.log("[Browser ID] Generated new browser ID:", browserId);
  } else {
    console.log("[Browser ID] Using existing browser ID:", browserId);
  }

  return browserId;
}

/**
 * Clear browser ID (for testing purposes)
 */
export async function clearBrowserId(): Promise<void> {
  await browser.storage.local.remove(BROWSER_ID_KEY);
}
