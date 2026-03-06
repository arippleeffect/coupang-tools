import * as XLSX from "xlsx";
import type { ProductState } from "@/types";

/**
 * 상품 데이터를 Excel 파일로 내보내기
 * @param products - 상품 상태 배열
 */
export function exportProductsToExcel(products: ProductState[]) {
  const normalRows = products
    .filter((p) => p.status === "COMPLETE")
    .filter((p) => p.type === "NORMAL")
    .map((p) => ({
      노출상품ID: p.productId,
      상품명: p.productName,
      브랜드: p.data?.brandName ?? "",
      조회수: p.data?.pv ?? "",
      판매량: p.data?.sales ?? "",
      매출: p.data?.totalSales,
      전환율: p.data?.rate ?? "",
    }));

  const adRows = products
    .filter((p) => p.status === "COMPLETE")
    .filter((p) => p.type === "AD")
    .map((p) => ({
      노출상품ID: p.productId,
      상품명: p.productName,
      브랜드: p.data?.brandName ?? "",
      조회수: p.data?.pv ?? "",
      판매량: p.data?.sales ?? "",
      전환율: p.data?.rate ?? "",
    }));

  const wb = XLSX.utils.book_new();
  if (normalRows.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(normalRows),
      "일반상품"
    );
  }
  if (adRows.length > 0) {
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(adRows),
      "광고상품"
    );
  }

  downloadWorkbook(wb, "products");
}

/**
 * Workbook 다운로드
 * @param wb - Excel Workbook
 * @param prefix - 파일명 접두사
 */
function downloadWorkbook(wb: XLSX.WorkBook, prefix: string) {
  const xlsxArray = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([xlsxArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fname = `${prefix}_${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(
    ts.getDate()
  )}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.xlsx`;
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
