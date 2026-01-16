import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  manifest: {
    name: "쿠팡 지표 분석",
    version: "1.0",
    permissions: [
      "contextMenus",
      "webRequest",
      "cookies",
      "webNavigation",
      "notifications",
      "storage",
    ],
    host_permissions: ["https://wing.coupang.com/*"],
  },
});
