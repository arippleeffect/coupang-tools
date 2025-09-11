import * as ReactDOM from "react-dom/client";
import { ErrorToast } from "./toast";
import { ContentScriptContext } from "#imports";
import React from "react";

export async function renderErrorToast(
  ctx: ContentScriptContext,
  message?: string
) {
  const ui = await createShadowRootUi(ctx, {
    anchor: "body",
    name: "ct-error-toast",
    position: "overlay",
    onMount(container) {
      const root = ReactDOM.createRoot(container);
      root.render(<ErrorToast message={message} />);
    },
  });

  ui.mount();
  setTimeout(() => ui.remove(), 4000);
}
