export default defineBackground(() => {
  // 페이지 우클릭 메뉴
  browser.contextMenus.create({
    id: "page-action",
    title: "로켓그로스 반출 액셀 다운로드",
    contexts: ["page"],
  });
});
