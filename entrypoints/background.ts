import {
  COUPANG_COOKIE_KEY,
  GetProductMetricsMsg,
  GetProductMsg,
  MESSAGE_TYPE,
  MessageResponse,
  PreMatchingSearchResponse,
} from "@/types";

export default defineBackground(() => {
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

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("info", info);
    if (!tab?.id) return;

    if (info.menuItemId === MESSAGE_TYPE.VIEW_PRODUCT_METRICS) {
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
          token: sessionCookie ?? token,
        };

        console.log("send message", message);
        await browser.tabs.sendMessage(tab.id, message);
      } catch (err: any) {
        // Ignore "Receiving end does not exist" errors (tab closed/reloaded)
        if (!err.message?.includes("Receiving end does not exist")) {
          console.error("[bg] failed to send message", err);
        }
      }
    }

    if (info.menuItemId === MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL) {
      const message = {
        type: MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL,
        tabId: tab.id,
      };

      try {
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
      msg: GetProductMetricsMsg | GetProductMsg,
      sender,
      sendResponse: (
        response: MessageResponse<PreMatchingSearchResponse>
      ) => void
    ) => {
      (async () => {
        console.log("msg.type", msg.type);
        console.log("msg.type", MESSAGE_TYPE.GET_PRODUCT);
        if (msg.type === MESSAGE_TYPE.GET_PRODUCT) {
          console.log("msg.type 여기탐");
          const keyword = (msg as GetProductMsg).keyword;
          const response = await searchProductByKeyword(keyword);
          sendResponse(response);
        }
      })();

      return true;
    }
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
    console.log("");
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
    console.log("tokne2::", tokne2);
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
    }
  );

  if (!res.ok) {
    let bodyText = "";
    try {
      bodyText = await res.text();
    } catch (error) {
      throw formatError(error, "PRE_MATCHING_SEARCH_FAILED");
    }
    console.log("res", res);
    const message =
      res.status === 429 ? "요청이 많아 서버가 잠시 응답을 제한했습니다." : "";
    throw formatError(
      {
        code: "PRE_MATCHING_SEARCH_FAILED",
        message: `[${res.status}] 상품 검색 요청 실패:${message} \n\n 잠시후 다시 시도해주세요`,
        error: bodyText,
      },
      "PRE_MATCHING_SEARCH_FAILED"
    );
  }

  const json = await res.json();
  return json;
}
