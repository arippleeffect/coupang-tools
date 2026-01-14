/**
 * Excel Export Exporter
 *
 * Creates and downloads Excel files
 */

import * as XLSX from 'xlsx';
import type { ProductState } from '@/types';

/**
 * Export products to Excel file
 */
export function exportProductsToExcel(products: ProductState[]) {
  const normalRows = products
    .filter((p) => p.status === 'COMPLETE')
    .filter((p) => p.type === 'NORMAL')
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      status: p.status,
      brandName: p.data?.brandName ?? '',
      pv: p.data?.pv ?? '',
      sales: p.data?.sales ?? '',
      totalSales: p.data?.totalSales,
      rate: p.data?.rate ?? '',
    }));

  const adRows = products
    .filter((p) => p.status === 'COMPLETE')
    .filter((p) => p.type === 'AD')
    .map((p) => ({
      productId: p.productId,
      productName: p.productName,
      status: p.status,
      brandName: p.data?.brandName ?? '',
      pv: p.data?.pv ?? '',
      sales: p.data?.sales ?? '',
      rate: p.data?.rate ?? '',
    }));

  const wb = XLSX.utils.book_new();
  if (normalRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(normalRows), '일반상품');
  }
  if (adRows.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(adRows), '광고상품');
  }

  downloadWorkbook(wb, 'products');
}

/**
 * Export vendor return items to Excel
 */
export function exportVendorReturnToExcel(items: any[]) {
  const rows: any[] = [];
  const safe = (v: any) => (v == null ? '' : String(v));

  for (const it of items) {
    const fcMap = it?.returnableQtyByFCTotal || {};
    const entries = Object.entries(fcMap) as [string, any][];

    if (entries.length === 0) {
      rows.push({
        vendorItemId: safe(it.vendorItemId),
        vendorInventoryId: safe(it.vendorInventoryId),
        vendorInventoryName: safe(it.vendorInventoryName),
        vendorInventoryItemName: safe(it.vendorInventoryItemName),
        vendorId: safe(it.vendorId),
        skuId: safe(it.skuId),
        productId: safe(it.productId),
        imageUrl: safe(
          it.imageUrl ||
            (it.mainImageEndPoint
              ? `https://image1.coupangcdn.com/image/${it.mainImageEndPoint}`
              : '')
        ),
        fcCode: '',
        fcName: '',
        qty: '',
        returnableQtyTotal: safe(it.returnableQtyTotal),
      });
    } else {
      for (const [fcCode, v] of entries) {
        const qty = v?.qty ?? '';
        const fcName = v?.fcName ?? '';
        rows.push({
          vendorItemId: safe(it.vendorItemId),
          vendorInventoryId: safe(it.vendorInventoryId),
          vendorInventoryName: safe(it.vendorInventoryName),
          vendorInventoryItemName: safe(it.vendorInventoryItemName),
          vendorId: safe(it.vendorId),
          skuId: safe(it.skuId),
          productId: safe(it.productId),
          imageUrl: safe(
            it.imageUrl ||
              (it.mainImageEndPoint
                ? `https://image1.coupangcdn.com/image/${it.mainImageEndPoint}`
                : '')
          ),
          fcCode: safe(fcCode),
          fcName: safe(fcName),
          qty: safe(qty),
          returnableQtyTotal: safe(it.returnableQtyTotal),
        });
      }
    }
  }

  const headers = [
    'vendorItemId',
    'vendorInventoryId',
    'vendorInventoryName',
    'vendorInventoryItemName',
    'vendorId',
    'skuId',
    'productId',
    'imageUrl',
    'fcCode',
    'fcName',
    'qty',
    'returnableQtyTotal',
  ];

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const colWidths = headers.map((h) => ({
    wch: Math.min(
      60,
      Math.max(
        String(h).length + 2,
        ...rows.map((r) => String((r as any)[h] ?? '').length + 2)
      )
    ),
  }));
  (ws as any)['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '반출목록');

  downloadWorkbook(wb, 'vendor-return');
}

/**
 * Download workbook as Excel file
 */
function downloadWorkbook(wb: XLSX.WorkBook, prefix: string) {
  const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([xlsxArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
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
