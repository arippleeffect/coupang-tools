import * as ReactDOM from "react-dom/client";
import { ErrorToast } from "./toast";
import { ContentScriptContext } from "#imports";

export function renderErrorToast(ctx: ContentScriptContext) {
  return createIntegratedUi(ctx, {
    anchor: "body",
    position: "overlay",
    onMount(container) {
      const root = ReactDOM.createRoot(container);
      root.render(ErrorToast());
    },
  });
}
