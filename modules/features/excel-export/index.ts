import { collectItems } from "./collector";
import { processItems } from "./processor";
import { exportVendorReturnToExcel, exportProductsToExcel } from "./exporter";
import { ensureToast, updateToast, finishToast } from "./toast";

export async function handleVendorReturnExport() {
  ensureToast();
  const pageSize = 50;
  const results = await collectItems(pageSize, updateToast, finishToast);

  const processedItems = processItems(results);

  try {
    exportVendorReturnToExcel(processedItems);
  } catch (e) {
    console.warn("CSV 다운로드 중 오류", e);
  }
}

export { exportProductsToExcel };
