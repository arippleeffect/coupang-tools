export enum MENU {
  ROCKETGROSS_EXPORT_EXCEL = "ROCKETGROSS_EXPORT_EXCEL",
  VIEW_PRODUCT_METRICS = "VIEW_PRODUCT_METRICS",
  GET_PRODUCT = "GET_PRODUCT",
}

export default defineBackground(() => {
  browser.contextMenus.create({
    id: MENU.ROCKETGROSS_EXPORT_EXCEL,
    title: "로켓그로스 반출 액셀 다운로드",
    contexts: ["page"],
  });

  browser.contextMenus.create({
    id: MENU.VIEW_PRODUCT_METRICS,
    title: "쿠팡 상품 지표보기",
    contexts: ["page"],
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) {
      return;
    }

    if (info.menuItemId === MENU.VIEW_PRODUCT_METRICS) {
      const token = await browser.cookies.get({
        name: "XSRF-TOKEN",
        url: "https://wing.coupang.com",
      });

      const message = {
        type: MENU.VIEW_PRODUCT_METRICS,
        tab: tab.id,
        token: token,
      };

      try {
        await browser.tabs.sendMessage(tab.id, message);
      } catch (err) {
        console.error("[bg] failed to send message", err);
      }
    }
    if (info.menuItemId === MENU.ROCKETGROSS_EXPORT_EXCEL) {
      const message = {
        type: MENU.ROCKETGROSS_EXPORT_EXCEL,
        tabId: tab.id,
      };

      try {
        await browser.tabs.sendMessage(tab.id, message);
        console.info("[bg] message sent to tab", tab.id);
      } catch (err) {
        console.error("[bg] failed to send message", err);
      }
    }
  });

  type GetProductMetricsMsg = {
    type: string;
    productIds?: string[];
    productId?: string | number;
  };

  type GetProductMsg = {
    type: string;
    keyword: string | number;
  };

  browser.runtime.onMessage.addListener(
    (msg: GetProductMetricsMsg | GetProductMsg, sender, sendResponse) => {
      if (msg.type === MENU.GET_PRODUCT) {
        (async () => {
          try {
            const keyword = (msg as GetProductMsg).keyword;
            if (keyword == null || keyword === "") {
              sendResponse({ error: "NO_PRODUCT_ID" });
              return;
            }

            const token = await browser.cookies.get({
              name: "XSRF-TOKEN",
              url: "https://wing.coupang.com",
            });

            if (!token?.value) {
              sendResponse({ error: "NO_XSRF_TOKEN" });
              return;
            }

            const xsrf = decodeURIComponent(token.value);
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
              } catch {}
              sendResponse({ ok: false, status: res.status, body: bodyText });
              return;
            }

            const data = (await res.json()) as {
              result: {
                attributeTypes: string | null;
                brandName: string | null;
                categoryId: number;
                deliveryMethod: string;
                displayCategoryInfo: {
                  categoryHierarchy: string;
                  leafCategoryCode: number;
                  rootCategoryCode: number;
                }[];
                imagePath: string;
                itemCountOfProduct: number;
                itemId: number;
                itemName: string;
                manufacture: string;
                matchType: string | null;
                matchingResultId: null;
                productId: number;
                productName: string;
                pvLast28Day: number;
                rating: number;
                ratingCount: number;
                salePrice: number;
                salesLast28d: number;
                sponsored: null;
                vendorItemId: number;
              }[];
            };

            sendResponse({ ok: true, data });
          } catch (err) {
            sendResponse({ ok: false, error: String(err) });
          }
        })();

        return true;
      }
    }
  );
});
