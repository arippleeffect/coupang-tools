import * as ReactDOM from "react-dom/client";
import Banner from "@/modules/ui/banner";
import { ErrorBoundary } from "@/modules/ui/error-boundary";
import { exportProductsToExcel } from "@/modules/features/excel-export";
import type { ProductState } from "@/types";
import { ContentScriptContext } from "#imports";

const rootMap = new WeakMap<HTMLElement, ReactDOM.Root>();
let bannerUi: any = null;

export function updateBanner(
  _ctx: ContentScriptContext,
  products: ProductState[]
) {
  if (!bannerUi) {
    bannerUi = createBannerUi();
  }

  const completeCount = products.filter(
    (p) => p.status === "COMPLETE" && p.data
  ).length;

  if (completeCount === 0) {
    bannerUi.unmount();
    return;
  }

  bannerUi.mount(products);
}

export function resetBanner() {
  bannerUi?.remove();
  bannerUi = null;
}

type BannerUi = {
  mounted: boolean;
  mount(products: ProductState[]): void;
  unmount(): void;
};

function createBannerUi(): BannerUi {
  let host: HTMLElement | null = null;
  let root: ReactDOM.Root | null = null;

  return {
    mounted: false,

    mount(products) {
      if (this.mounted) {
        // 이미 마운트돼 있으면 리렌더만
        root?.render(
          <ErrorBoundary>
            <Banner
              count={
                products.filter((p) => p.status === "COMPLETE" && p.data).length
              }
              onDownloadExcel={() => exportProductsToExcel(products)}
            />
          </ErrorBoundary>
        );
        return;
      }

      host = document.createElement("div");
      host.id = "my-banner-ui";
      document.body.appendChild(host);

      root = ReactDOM.createRoot(host);
      root.render(
        <ErrorBoundary>
          <Banner
            count={
              products.filter((p) => p.status === "COMPLETE" && p.data).length
            }
            onDownloadExcel={() => exportProductsToExcel(products)}
          />
        </ErrorBoundary>
      );

      this.mounted = true;
    },

    unmount() {
      if (!this.mounted) return;

      root?.unmount();
      host?.remove();

      root = null;
      host = null;
      this.mounted = false;
    },
  };
}
