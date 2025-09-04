import { MENU } from "./background";
import * as XLSX from "xlsx";

function ensureToast() {
  if (document.getElementById("ct-toast")) return;
  const styleId = "ct-toast-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      #ct-toast{position:fixed;right:16px;bottom:16px;z-index:2147483647;background:#111;color:#fff;padding:10px 12px;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.3);font:13px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;opacity:.95}
      #ct-toast .ct-title{font-weight:600;margin-bottom:4px}
      #ct-toast .ct-sub{opacity:.85}
      #ct-toast .ct-bar{height:3px;background:#2ecc71;margin-top:8px;border-radius:2px;transform-origin:left;transform:scaleX(0)}
      #ct-toast.ct-error{background:#8b1d1d}
    `;
    document.head.appendChild(style);
  }
  const wrap = document.createElement("div");
  wrap.id = "ct-toast";
  wrap.style.width = "200px"; // 원하는 너비
  wrap.style.height = "80px"; // 원하는 높이
  wrap.style.boxSizing = "border-box";
  wrap.style.overflow = "hidden";
  wrap.innerHTML = `
    <div class="ct-title">수집 진행 중…</div>
    <div class="ct-sub">수집: <span id="ct-count">0</span>개 • 페이지 <span id="ct-page">0</span></div>
    <div class="ct-bar" id="ct-bar"></div>
  `;
  document.body.appendChild(wrap);
}
function updateToast(
  count: number,
  page: number,
  currentSize: number,
  totalSize: number
) {
  ensureToast();
  const c = document.getElementById("ct-count");
  const p = document.getElementById("ct-page");
  const bar = document.getElementById("ct-bar") as HTMLDivElement | null;
  if (c) c.textContent = String(count);
  if (p) p.textContent = String(page);
  if (bar) {
    const ratio = Math.max(0, Math.min(1, currentSize / totalSize)); // unknown total; show subtle motion
    bar.style.transform = `scaleX(${ratio || 0.1})`;
  }
}
function finishToast(ok: boolean, finalCount: number) {
  ensureToast();
  const t = document.getElementById("ct-toast");
  if (!t) return;
  if (!ok) t.classList.add("ct-error");
  const title = t.querySelector(".ct-title");
  const sub = t.querySelector(".ct-sub");
  if (title) title.textContent = ok ? "수집 완료" : "수집 중단";
  if (sub) sub.textContent = `총 ${finalCount}개`;
  const bar = document.getElementById("ct-bar");
  if (bar) (bar as HTMLDivElement).style.transform = "scaleX(1)";
  setTimeout(() => t.remove(), 2500);
}

const getCookieValue = (key: string): string => {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`))
      ?.split("=")[1] || ""
  );
};

const fetchItemList = async ({
  pageSize,
  pageIndex,
  token,
}: {
  pageSize: number;
  pageIndex: number;
  token: string;
}): Promise<Response> => {
  return fetch(
    "https://wing.coupang.com/tenants/rfm/goldfish/vendor-return/itemList",
    {
      headers: {
        accept: "application/json, text/plain, */*",
        "content-type": "application/json",
        "x-xsrf-token": decodeURIComponent(token),
      },
      referrer:
        "https://wing.coupang.com/tenants/rfm/goldfish/vendor-return/creation",
      body: JSON.stringify({ pageSize, pageIndex }),
      method: "POST",
      credentials: "include",
    }
  );
};

async function collectItems(pageSize: number): Promise<any[]> {
  const results: any[] = [];
  let pageIndex = 0;

  while (true) {
    const token = getCookieValue("XSRF-TOKEN");
    try {
      const res = await fetchItemList({ pageSize, pageIndex, token });

      if (!res.ok) {
        finishToast(false, results.length);
        break;
      }

      const data = await res.json();
      const items = Array.isArray(data?.content) ? data.content : [];

      if (!items.length) {
        finishToast(true, results.length);
        break;
      }

      results.push(...items);
      updateToast(results.length, pageIndex, pageIndex, data.totalPages);

      // 한 페이지에 pageSize보다 적게 오면 마지막 페이지로 판단하고 종료
      if (items.length < pageSize) {
        finishToast(true, results.length);
        break;
      }

      // 다음 페이지로 증가
      pageIndex += 1;
    } catch (e) {
      console.warn("요청 중 예외 발생 - 중단합니다.", e);
      finishToast(false, results.length);
      break;
    }
  }
  return results;
}

const Ee = (t: string) => t.startsWith("XRC") || t.startsWith("CHA9");

export default defineContentScript({
  matches: ["https://wing.coupang.com/*"],
  main() {
    browser.runtime.onMessage.addListener(async (msg) => {
      if (msg.type === MENU.ROCKETGROSS_EXPORT_EXCEL) {
        ensureToast();
        const pageSize = 50;
        const results = await collectItems(pageSize);
        const c = new Set([
          "SFSCH1",
          "INC20",
          "SFAYG10",
          "SFNYJ2",
          "SFCHJ1",
          "SFNHN1",
          "SFISN5",
          "SFGWJ1",
          "SFWBS2",
          "SFGMP1",
          "SFISN1",
          "SFBSN5",
          "SFDJN2",
          "SFNYJ3",
          "SFYAT1",
          "SFJEJ1",
          "SFNGH2",
          "SFWDG1",
          "SFBUC3",
          "SFCHA1",
          "SFGNP1",
          "SFDJN3",
        ]);

        const filteredList = results.map((item) => {
          if (!Object.keys(item.returnableQtyByFCTotal).some((g) => c.has(g))) {
            return item;
          }

          let S: string | null = null;
          for (const g in item.returnableQtyByFCTotal) {
            if (Ee(g)) {
              S = g;
              break;
            }
          }

          if (!S) {
            S = "CHA9";
            item.returnableQtyByFCTotal[S] = {
              qty: 0,
              fcName: "CHA9",
            };
          }

          Object.keys(item.returnableQtyByFCTotal)
            .filter((g) => c.has(g))
            .forEach((g) => {
              const W = item.returnableQtyByFCTotal[g];
              item.returnableQtyByFCTotal[S!].qty += W?.qty ?? 0;
            });

          Object.keys(item.returnableQtyByFCTotal)
            .filter((g) => c.has(g))
            .forEach((g) => {
              delete item.returnableQtyByFCTotal[g];
            });

          return item;
        });

        console.log("filteredList::", filteredList);

        try {
          const rows: any[] = [];
          const safe = (v: any) => (v == null ? "" : String(v));

          for (const it of filteredList) {
            const fcMap = it?.returnableQtyByFCTotal || {};

            const entries = Object.entries(fcMap) as [string, any][];

            if (entries.length === 0) {
              // FC 정보가 없으면 빈 FC로 1행
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
                      : "")
                ),
                fcCode: "",
                fcName: "",
                qty: "",
                returnableQtyTotal: safe(it.returnableQtyTotal),
              });
            } else {
              for (const [fcCode, v] of entries) {
                const qty = v?.qty ?? "";
                const fcName = v?.fcName ?? "";
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
                        : "")
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
            "vendorItemId",
            "vendorInventoryId",
            "vendorInventoryName",
            "vendorInventoryItemName",
            "vendorId",
            "skuId",
            "productId",
            "imageUrl",
            "fcCode",
            "fcName",
            "qty",
            "returnableQtyTotal",
          ];

          const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
          const colWidths = headers.map((h) => ({
            wch: Math.min(
              60,
              Math.max(
                String(h).length + 2,
                ...rows.map((r) => String((r as any)[h] ?? "").length + 2)
              )
            ),
          }));
          (ws as any)["!cols"] = colWidths;

          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "반출목록");

          const xlsxArray = XLSX.write(wb, { bookType: "xlsx", type: "array" });
          const blob = new Blob([xlsxArray], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          const ts = new Date();
          const pad = (n: number) => String(n).padStart(2, "0");
          const fname = `vendor-return_${ts.getFullYear()}${pad(
            ts.getMonth() + 1
          )}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(
            ts.getMinutes()
          )}${pad(ts.getSeconds())}.xlsx`;
          a.href = url;
          a.download = fname;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("CSV 다운로드 중 오류", e);
        }

        return;
      }
    });
  },
});
