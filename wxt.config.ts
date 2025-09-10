import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  manifest: {
    name: "쿠팡 도구 모음",
    version: "1.0",

    permissions: [
      "contextMenus",
      "webRequest",
      "cookies",
      "webNavigation",
      "notifications",
    ],
    host_permissions: ["https://wing.coupang.com/*"],
  },
});
