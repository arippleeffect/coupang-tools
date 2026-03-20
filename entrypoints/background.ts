import {
  COUPANG_COOKIE_KEY,
  GetProductMetricsMsg,
  GetProductMsg,
  MESSAGE_TYPE,
  MessageResponse,
  PreMatchingSearchResponse,
  LicenseActivateResponse,
  LicenseInfo,
  LicenseCheckResult,
} from "@/types";
import {
  isLicenseValid,
  getLicense,
  removeLicense,
  saveLicense,
} from "@/modules/core/license-storage";
import { activateLicense, deactivateLicense } from "@/modules/api/license";
import { getOrCreateDeviceId } from "@/modules/core/device-id";

const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// 7일 캐시 (일주일에 한 번 서버 검증)
const VALIDATION_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const VALIDATION_CACHE_KEY = "ct_license_validation_cache";

async function loadCachedValidation(): Promise<{ result: LicenseCheckResult; timestamp: number } | null> {
  const data = await browser.storage.local.get(VALIDATION_CACHE_KEY);
  return data[VALIDATION_CACHE_KEY] ?? null;
}

async function saveCachedValidation(result: LicenseCheckResult): Promise<void> {
  await browser.storage.local.set({
    [VALIDATION_CACHE_KEY]: { result, timestamp: Date.now() },
  });
}

async function invalidateValidationCache(): Promise<void> {
  await browser.storage.local.remove(VALIDATION_CACHE_KEY);
}

/**
 * 라이선스 검증 API 호출
 */
async function callValidationAPI(license: LicenseInfo): Promise<LicenseCheckResult> {
  try {
    const deviceId = await getOrCreateDeviceId();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/license-check`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_KEY}`,
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        activationToken: license.activationToken,
        deviceId,
      }),
    });

    const data: LicenseCheckResult = await response.json();
    return data;
  } catch (error) {
    console.error("[License Validator] API error:", error);
    return { valid: false, reason: "INTERNAL_ERROR", message: "네트워크 오류" };
  }
}

/**
 * 라이선스 검증 (7일 캐시로 주 1회 서버 검증)
 */
async function validateLicenseOnAction(): Promise<LicenseCheckResult> {
  // 7일 이내 캐시가 있으면 반환
  const cached = await loadCachedValidation();
  if (cached && Date.now() - cached.timestamp < VALIDATION_CACHE_TTL) {
    return cached.result;
  }

  try {
    const license = await getLicense();

    if (!license) {
      return { valid: false, reason: "NOT_FOUND" };
    }

    const result = await callValidationAPI(license);

    if (!result.valid) {
      if (result.reason === "DEVICE_MISMATCH" || result.reason === "SUSPENDED") {
        await removeLicense();
      }
    }

    await saveCachedValidation(result);
    return result;
  } catch (error) {
    console.error("[License Validator] Error:", error);
    return { valid: false, reason: "INTERNAL_ERROR" };
  }
}

export default defineBackground(() => {
  // Handle extension icon click - always open license page
  browser.action.onClicked.addListener(async () => {
    const licensePageUrl = browser.runtime.getURL("/license.html");
    await browser.tabs.create({ url: licensePageUrl });
  });

  // Initialize context menus only if license is valid
  initializeContextMenus();

  // Re-initialize context menus when license status changes
  browser.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === "local" && changes.ct_license) {
      await initializeContextMenus();
    }
  });

  async function initializeContextMenus() {
    const hasLicense = await isLicenseValid();

    // Remove all existing menus first
    await browser.contextMenus.removeAll();

    if (!hasLicense) {
      // No license - show only activation menu
      browser.contextMenus.create({
        id: "activate_license",
        title: "라이선스 활성화",
        contexts: ["page"],
      });
      return;
    }

    // Has license - show all menus
    browser.contextMenus.create({
      id: MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL,
      title: "로켓그로스 반출 액셀 다운로드",
      contexts: ["page"],
      documentUrlPatterns: ["https://wing.coupang.com/*"],
    });

    browser.contextMenus.create({
      id: MESSAGE_TYPE.VIEW_PRODUCT_METRICS,
      title: "쿠팡 상품 지표보기",
      contexts: ["page"],
      documentUrlPatterns: [
        "https://www.coupang.com/*",
        "https://shop.coupang.com/*",
      ],
    });
  }

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    // Handle activation menu click
    if (info.menuItemId === "activate_license") {
      const licensePageUrl = browser.runtime.getURL("/license.html");
      await browser.tabs.create({ url: licensePageUrl });
      return;
    }

    if (info.menuItemId === MESSAGE_TYPE.VIEW_PRODUCT_METRICS) {
      const result = await validateLicenseOnAction();
      if (!result.valid) {
        console.warn("[bg] License validation failed:", result.reason);

        try {
          await browser.tabs.sendMessage(tab.id, {
            type: MESSAGE_TYPE.LICENSE_INVALID,
            reason: result.reason,
            message: result.message,
          });
        } catch {
          // tab이 닫혔거나 content script가 없는 경우 무시
        }

        await initializeContextMenus();
        return;
      }

      try {
        const token = await browser.cookies.get({
          name: COUPANG_COOKIE_KEY.XSRF_TOKEN,
          url: "https://wing.coupang.com",
        });
        const sessionCookie = await browser.cookies.get({
          name: "sxSessionId",
          url: "https://wing.coupang.com",
        });

        const message = {
          type: MESSAGE_TYPE.VIEW_PRODUCT_METRICS,
          tab: tab.id,
          token: sessionCookie ? token : null,
        };

        await browser.tabs.sendMessage(tab.id, message);
      } catch (err: any) {
        if (!err.message?.includes("Receiving end does not exist")) {
          console.error("[bg] failed to send message", err);
        }
      }
    }

    if (info.menuItemId === MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL) {
      const result = await validateLicenseOnAction();
      if (!result.valid) {
        console.warn("[bg] License validation failed for ROCKETGROSS_EXPORT_EXCEL:", result.reason);

        try {
          await browser.tabs.sendMessage(tab.id, {
            type: MESSAGE_TYPE.LICENSE_INVALID,
            reason: result.reason,
            message: result.message,
          });
        } catch {
          // tab이 닫혔거나 content script가 없는 경우 무시
        }

        await initializeContextMenus();
        return;
      }

      const message = {
        type: MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL,
        tabId: tab.id,
      };

      try {
        await browser.tabs.sendMessage(tab.id, message);
      } catch (err: any) {
        if (!err.message?.includes("Receiving end does not exist")) {
          console.error("[bg] failed to send message", err);
        }
      }
    }

    if (info.menuItemId === MESSAGE_TYPE.PCID_INIT) {
    }
  });

  browser.runtime.onMessage.addListener(
    (
      msg:
        | GetProductMetricsMsg
        | GetProductMsg
        | { type: MESSAGE_TYPE.LICENSE_CHECK }
        | {
            type: MESSAGE_TYPE.LICENSE_ACTIVATE;
            email: string;
            licenseKey: string;
            confirm?: boolean;
          }
        | { type: MESSAGE_TYPE.LICENSE_DEACTIVATE }
        | { type: MESSAGE_TYPE.LICENSE_VALIDATE },
      sender,
      sendResponse: (
        response:
          | MessageResponse<PreMatchingSearchResponse>
          | LicenseActivateResponse,
      ) => void,
    ) => {
      (async () => {
        if (msg.type === MESSAGE_TYPE.GET_PRODUCT) {
          const keyword = (msg as GetProductMsg).keyword;
          const response = await searchProductByKeyword(keyword);
          sendResponse(response);
        }

        if (msg.type === MESSAGE_TYPE.LICENSE_CHECK) {
          const isValid = await isLicenseValid();
          const license = await getLicense();
          sendResponse({
            ok: isValid,
            license: license || undefined,
          });
        }

        if (msg.type === MESSAGE_TYPE.LICENSE_ACTIVATE) {
          const { email, licenseKey, confirm: confirmed } = msg as {
            type: MESSAGE_TYPE.LICENSE_ACTIVATE;
            email: string;
            licenseKey: string;
            confirm?: boolean;
          };

          const deviceId = await getOrCreateDeviceId();

          const response = await activateLicense({
            email,
            licenseKey,
            deviceId,
            confirm: confirmed,
          });

          if (response.ok && response.license) {
            await saveLicense(response.license);
            await invalidateValidationCache();
          }

          sendResponse(response);
        }

        if (msg.type === MESSAGE_TYPE.LICENSE_DEACTIVATE) {
          const license = await getLicense();
          if (license) {
            const deviceId = await getOrCreateDeviceId();
            const response = await deactivateLicense({
              activationToken: license.activationToken,
              deviceId,
            });

            if (response.ok) {
              await removeLicense();
              await invalidateValidationCache();
            }

            sendResponse({ ok: response.ok, message: response.message });
          } else {
            sendResponse({ ok: false, message: "라이선스가 없습니다." });
          }
        }

        if (msg.type === MESSAGE_TYPE.LICENSE_VALIDATE) {
          const result = await validateLicenseOnAction();
          sendResponse({ ok: result.valid, reason: result.reason, message: result.message } as any);
        }
      })();

      return true;
    },
  );

  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    browser.tabs
      .sendMessage(details.tabId, {
        type: MESSAGE_TYPE.EXCEL_DOWNLOAD_BANNER_INIT,
      })
      .catch((err: any) => {
        if (!err.message?.includes("Receiving end does not exist")) {
          console.error("[bg] failed to send navigation message", err);
        }
      });
  });
});

const formatError = (err: any, defaultCode: string) => {
  if (typeof err === "string") {
    return {
      ok: false,
      code: defaultCode,
      message: err,
      error: err,
    };
  } else if (err && typeof err === "object") {
    return {
      ok: false,
      code: err.code || defaultCode,
      message: err.message || String(err),
      error: err.error || err.message || String(err),
    };
  } else {
    return {
      ok: false,
      code: defaultCode,
      message: String(err),
      error: String(err),
    };
  }
};

const searchProductByKeyword = async (keyword: string | number) => {
  if (keyword == null || keyword === "") {
    return {
      ok: false,
      code: "NO_PRODUCT_ID",
      message: "키워드가 없습니다.",
      error: "키워드가 없습니다.",
    };
  }
  try {
    const token = await browser.cookies.get({
      name: COUPANG_COOKIE_KEY.XSRF_TOKEN,
      url: "https://wing.coupang.com",
    });
    const sessionCookie = await browser.cookies.get({
      name: "sxSessionId",
      url: "https://wing.coupang.com",
    });

    if (!token?.value || !sessionCookie?.value) {
      return {
        ok: false,
        code: "NO_XSRF_TOKEN",
        message: "새 탭에서 쿠팡윙 로그인을 해주세요",
        error: "새 탭에서 쿠팡윙 로그인을 해주세요",
      };
    }

    const data = await fetchPreMatchingSearch<PreMatchingSearchResponse>({
      token: token.value,
      keyword,
    });

    return { ok: true, data };
  } catch (err) {
    return formatError(err, "SEARCH_PRODUCT_FAILED");
  }
};

async function fetchPreMatchingSearch<T>({
  token,
  keyword,
}: {
  token: string;
  keyword: string | number;
}): Promise<T> {
  const xsrf = decodeURIComponent(token);
  let res: Response;
  try {
    res = await fetch(
      "https://wing.coupang.com/tenants/seller-web/pre-matching/search",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-xsrf-token": xsrf,
        },
        credentials: "include",
        body: JSON.stringify({
          keyword: String(keyword),
          excludedProductIds: [],
          searchPage: 0,
          searchOrder: "DEFAULT",
          sortType: "DEFAULT",
        }),
      },
    );
  } catch {
    // CORS 에러 (세션 만료로 로그인 페이지 redirect 시 발생)
    throw {
      code: "NO_XSRF_TOKEN",
      message: "새 탭에서 쿠팡윙 로그인을 해주세요",
      error: "새 탭에서 쿠팡윙 로그인을 해주세요",
    };
  }

  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch (error) {
      throw formatError(error, "PRE_MATCHING_SEARCH_FAILED");
    }
    const message =
      res.status === 429 ? "요청이 많아 서버가 잠시 응답을 제한했습니다." : "";
    throw formatError(
      {
        code: "PRE_MATCHING_SEARCH_FAILED",
        message: `[${res.status}] 상품 검색 요청 실패:${message} \n\n 잠시 후 다시 시도해주세요`,
        error: bodyText,
      },
      "PRE_MATCHING_SEARCH_FAILED",
    );
  }

  const json = await res.json();
  return json;
}
