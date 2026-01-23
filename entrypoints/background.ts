import {
  COUPANG_COOKIE_KEY,
  GetProductMetricsMsg,
  GetProductMsg,
  MESSAGE_TYPE,
  MessageResponse,
  PreMatchingSearchResponse,
  LicenseActivateResponse,
} from "@/types";
import { isLicenseValid, getLicense } from "@/modules/core/license-storage";
import { activateLicense, deactivateLicense } from "@/modules/api/license";
import {
  validateLicenseOnAction,
  invalidateValidationCache,
} from "@/modules/core/license-validator";

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
      // Just update menus, validation will happen periodically or on action
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
        title: "라이센스 활성화",
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
      // Validate license before processing
      const isValid = await validateLicenseOnAction();
      if (!isValid) {
        console.warn("[bg] License validation failed for VIEW_PRODUCT_METRICS");
        // Re-initialize context menus to show activation menu
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
        // Ignore "Receiving end does not exist" errors (tab closed/reloaded)
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
          }
        | { type: MESSAGE_TYPE.LICENSE_DEACTIVATE },
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
          const { email, licenseKey } = msg as {
            type: MESSAGE_TYPE.LICENSE_ACTIVATE;
            email: string;
            licenseKey: string;
          };
          const response = await activateLicense({
            email,
            licenseKey,
          });

          // Invalidate cache after activation
          if (response.ok) {
            invalidateValidationCache();
          }

          sendResponse(response);
        }

        if (msg.type === MESSAGE_TYPE.LICENSE_DEACTIVATE) {
          const license = await getLicense();
          if (license) {
            const response = await deactivateLicense({
              activationToken: license.activationToken,
            });

            // Invalidate cache after deactivation
            if (response.ok) {
              invalidateValidationCache();
            }

            sendResponse({ ok: response.ok, message: response.message });
          } else {
            sendResponse({ ok: false, message: "라이센스가 없습니다." });
          }
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
        // Ignore "Receiving end does not exist" errors (tab closed/reloaded)
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
    const tokne2 = await browser.cookies.getAll({
      url: "https://wing.coupang.com",
    });
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
        message: "새탭에 쿠팡윙로그인을 해주세요",
        error: "새탭에 쿠팡윙로그인을 해주세요",
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
  const res = await fetch(
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
        // TODO: 사용하는거 한번 확인
        excludedProductIds: [],
        searchPage: 0,
        searchOrder: "DEFAULT",
        sortType: "DEFAULT",
      }),
    },
  );

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
        message: `[${res.status}] 상품 검색 요청 실패:${message} \n\n 잠시후 다시 시도해주세요`,
        error: bodyText,
      },
      "PRE_MATCHING_SEARCH_FAILED",
    );
  }

  const json = await res.json();
  return json;
}
