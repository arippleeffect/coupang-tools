import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  manifest: {
    name: "coupang-tools",
    version: "1.0",
    permissions: ["contextMenus"],
  },
});
