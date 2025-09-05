export enum MENU {
  ROCKETGROSS_EXPORT_EXCEL = "ROCKETGROSS_EXPORT_EXCEL",
  VIEW_PRODUCT_METRICS = "VIEW_PRODUCT_METRICS",
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

    console.log("tabID", tab.id);

    console.log("info", info);

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

      console.log("tabId:: ", tab.id);
      console.log("message:: ", message);

      try {
        await browser.tabs.sendMessage(tab.id, message);
        console.info("[bg] message sent to tab", tab.id);
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
});
