export default defineBackground(() => {
  // 페이지 우클릭 메뉴
  browser.contextMenus.create({
    id: "rocketgross-export-excel",
    title: "로켓그로스 반출 액셀 다운로드",
    contexts: ["page"],
  });

  browser.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "rocketgross-export-excel" && tab?.id) {
      browser.tabs.sendMessage(tab?.id, { step: 1, tabId: tab?.id });
    }
  });
});
