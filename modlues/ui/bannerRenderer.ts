import ReactDOM from "react-dom/client";
import { ContentScriptContext } from "#imports";
import Banner from "./banner";

export function renderProductBanner(
  ctx: ContentScriptContext,
  products: { length: number }
) {
  return createIntegratedUi(ctx, {
    anchor: "body",
    position: "overlay",
    onMount(container) {
      const root = ReactDOM.createRoot(container);
      root.render(
        Banner({ count: products.length, onDownloadExcel: () => {} })
      );
    },
  });
}
