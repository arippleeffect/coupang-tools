import { waitElement } from "@1natsu/wait-element";

const RETURN_MGT_URL =
  "https://wing.coupang.com/tenants/rfm/goldfish/vendor-return/mgt";

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
  // 🔒 고정 크기(내용과 무관)
  wrap.style.width = "200px"; // 원하는 너비
  wrap.style.height = "80px"; // 원하는 높이
  wrap.style.boxSizing = "border-box";
  // (선택) 내용 넘침 방지/말줄임
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

export default defineContentScript({
  matches: ["https://wing.coupang.com/*"],
  main() {
    browser.runtime.onMessage.addListener(async (msg, sender) => {
      if (msg.step === 1) {
        ensureToast();
        const results: any[] = [];
        const pageSize = 50;
        let pageIndex = 0;

        while (true) {
          // 쿠키에서 XSRF-TOKEN 추출
          const xsrfToken =
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("XSRF-TOKEN="))
              ?.split("=")[1] || "";

          try {
            const res = await fetch(
              "https://wing.coupang.com/tenants/rfm/goldfish/vendor-return/itemList",
              {
                headers: {
                  accept: "application/json, text/plain, */*",
                  "content-type": "application/json",
                  "x-xsrf-token": decodeURIComponent(xsrfToken),
                },
                referrer:
                  "https://wing.coupang.com/tenants/rfm/goldfish/vendor-return/creation",
                body: JSON.stringify({ pageSize, pageIndex }),
                method: "POST",
                credentials: "include",
              }
            );

            if (!res.ok) {
              console.warn("요청 실패 - 중단합니다.", pageIndex, res.status);
              finishToast(false, results.length);
              break; // 실패 시 중단
            }

            const data = await res.json();
            const items = Array.isArray(data?.content) ? data.content : [];

            if (!items.length) {
              // 더 이상 아이템이 없으면 종료
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
            break; // 예외 시 중단
          }
        }

        // === Excel(CSV) 다운로드: FC별로 행 분리 ===
        try {
          const rows: any[] = [];
          const safe = (v: any) => (v == null ? "" : String(v));

          for (const it of results) {
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

          // CSV 생성
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

          const toCsvCell = (s: string) => {
            // 셀에 콤마/따옴표/개행 있으면 CSV 규격에 맞게 이스케이프
            if (s == null) return "";
            if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
          };

          const csv = [headers.join(",")]
            .concat(
              rows.map((r) =>
                headers
                  .map((h) => toCsvCell(String((r as any)[h] ?? "")))
                  .join(",")
              )
            )
            .join("\n");

          const blob = new Blob(["\ufeff" + csv], {
            type: "text/csv;charset=utf-8",
          }); // BOM 포함 → 엑셀 한글 깨짐 방지
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
