import * as ReactDOM from "react-dom/client";
import { ErrorToast } from "./toast";
import { ContentScriptContext } from "#imports";
import React from "react";

export async function renderErrorToast(
  ctx: ContentScriptContext,
  message?: string,
  code?: string
) {
  const ui = await createShadowRootUi(ctx, {
    anchor: "body",
    name: "ct-error-toast",
    position: "overlay",
    onMount(container) {
      const root = ReactDOM.createRoot(container);
      root.render(<ErrorToast message={message} code={code} />);
    },
  });

  ui.mount();
  // NO_PRODUCT_LIST는 더 오래 보여줌
  const timeout = code === "NO_PRODUCT_LIST" ? 8000 : 4000;
  setTimeout(() => ui.remove(), timeout);
}
