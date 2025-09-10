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
  });

  browser.contextMenus.create({
    id: MESSAGE_TYPE.VIEW_PRODUCT_METRICS,
    title: "쿠팡 상품 지표보기",
    contexts: ["page"],
  });

  browser.contextMenus.create({
    id: MESSAGE_TYPE.VIEW_PRODUCT_METRICS,
    title: "쿠팡 상품 지표보기",
    contexts: ["page"],
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    if (info.menuItemId === MESSAGE_TYPE.VIEW_PRODUCT_METRICS) {
      try {
        const token = await browser.cookies.get({
          name: COUPANG_COOKIE_KEY.XSRF_TOKEN,
          url: "https://wing.coupang.com",
        });

        const message = {
          type: MESSAGE_TYPE.VIEW_PRODUCT_METRICS,
          tab: tab.id,
          token: token,
        };

        await browser.tabs.sendMessage(tab.id, message);
      } catch (err) {
        console.error("[bg] failed to send message", err);
      }
    }

    if (info.menuItemId === MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL) {
      const message = {
        type: MESSAGE_TYPE.ROCKETGROSS_EXPORT_EXCEL,
        tabId: tab.id,
      };

      try {
        await browser.tabs.sendMessage(tab.id, message);
      } catch (err) {
        console.error("[bg] failed to send message", err);
      }
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
        if (msg.type === MESSAGE_TYPE.GET_PRODUCT) {
          const keyword = (msg as GetProductMsg).keyword;
          const response = await searchProductByKeyword(keyword);
          sendResponse(response);
        }
      })();

      return true;
    }
  );

  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    browser.tabs.sendMessage(details.tabId, {
      type: MESSAGE_TYPE.EXCEL_DOWNLOAD_BANNER_INIT,
    });
  });
});

const searchProductByKeyword = async (keyword: string | number) => {
  if (keyword == null || keyword === "") {
    return { ok: false, error: "NO_PRODUCT_ID" };
  }
  try {
    const token = await browser.cookies.get({
      name: COUPANG_COOKIE_KEY.XSRF_TOKEN,
      url: "https://wing.coupang.com",
    });

    if (!token?.value) {
      return { ok: false, error: "NO_XSRF_TOKEN" };
    }

    const data = await fetchPreMatchingSearch<PreMatchingSearchResponse>({
      token: token.value,
      keyword,
    });

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: String(err) };
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
      throw new Error(`PreMatchingSearch failed: ${res.status} ${error}`);
    }
    throw new Error(`PreMatchingSearch failed: ${res.status} ${bodyText}`);
  }

  const json = await res.json();
  return json;
}
