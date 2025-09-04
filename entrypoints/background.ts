export enum MENU {
  ROCKETGROSS_EXPORT_EXCEL = "ROCKETGROSS_EXPORT_EXCEL",
}

export default defineBackground(() => {
  browser.contextMenus.create({
    id: MENU.ROCKETGROSS_EXPORT_EXCEL,
    title: "로켓그로스 반출 액셀 다운로드",
    contexts: ["page"],
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== MENU.ROCKETGROSS_EXPORT_EXCEL || !tab?.id) return;
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
  });
});
