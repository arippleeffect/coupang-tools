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

// 동일 페이지 내 반복 호출 방지용 짧은 캐시 (30초)
const VALIDATION_CACHE_TTL = 30_000;
let lastValidation: { result: LicenseCheckResult; timestamp: number } | null = null;

function invalidateValidationCache() {
  lastValidation = null;
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

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      return { valid: false, reason: "INTERNAL_ERROR", message: "서버 응답 오류" };
    }

    try {
      const data: LicenseCheckResult = await response.json();
      return data;
    } catch {
      return { valid: false, reason: "INTERNAL_ERROR", message: "서버 응답 오류" };
    }
  } catch (error) {
    console.error("[License Validator] API error:", error);
    return { valid: false, reason: "INTERNAL_ERROR", message: "네트워크 오류" };
  }
}

/**
 * 라이선스 검증 (30초 캐시로 동일 페이지 내 반복 호출 방지)
 */
async function validateLicenseOnAction(): Promise<LicenseCheckResult> {
  // 30초 내 이전 결과가 있으면 캐시 반환
  if (lastValidation && Date.now() - lastValidation.timestamp < VALIDATION_CACHE_TTL) {
    return lastValidation.result;
  }

  try {
    const license = await getLicense();

    if (!license) {
      return { valid: false, reason: "NOT_FOUND" };
    }

    const result = await callValidationAPI(license);

    if (!result.valid) {
      // DEVICE_MISMATCH 또는 SUSPENDED인 경우 로컬 라이선스 정리
      if (result.reason === "DEVICE_MISMATCH" || result.reason === "SUSPENDED") {
        await removeLicense();
      }
    }

    lastValidation = { result, timestamp: Date.now() };
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
      // 매번 서버에 라이선스 체크
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
            invalidateValidationCache();
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
              invalidateValidationCache();
            }

            sendResponse({ ok: response.ok, message: response.message });
          } else {
            sendResponse({ ok: false, message: "라이선스가 없습니다." });
          }
        }

        if (msg.type === MESSAGE_TYPE.LICENSE_VALIDATE) {
          const result = await validateLicenseOnAction();
          sendResponse({ ok: result.valid, reason: result.reason, message: result.message });
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
  const MAX_RETRIES = 10;
  let currentToken = token;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // HTML 응답 후 쿠키에 갱신된 XSRF 토큰을 재취득
      const fresh = await browser.cookies.get({
        name: COUPANG_COOKIE_KEY.XSRF_TOKEN,
        url: "https://wing.coupang.com",
      });
      currentToken = fresh?.value || currentToken;
    }

    const xsrf = decodeURIComponent(currentToken);
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

    const contentType = res.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      // XSRF 토큰 만료로 HTML이 반환된 경우 → 재시도
      if (attempt < MAX_RETRIES) continue;
      throw {
        code: "PRE_MATCHING_SEARCH_FAILED",
        message: "요청이 많아 잠시 후 다시 시도해주세요.",
        error: "Unexpected non-JSON response",
      };
    }

    try {
      return await res.json() as T;
    } catch {
      if (attempt < MAX_RETRIES) continue;
      throw {
        code: "PRE_MATCHING_SEARCH_FAILED",
        message: "요청이 많아 잠시 후 다시 시도해주세요.",
        error: "JSON parse failed",
      };
    }
  }

  throw {
    code: "PRE_MATCHING_SEARCH_FAILED",
    message: "요청이 많아 잠시 후 다시 시도해주세요.",
    error: "Max retries exceeded",
  };
}
