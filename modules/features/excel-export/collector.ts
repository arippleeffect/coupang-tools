import { getCookieValue } from "@/modules/core/dom";

async function fetchItemList({
  pageSize,
  pageIndex,
  token,
}: {
  pageSize: number;
  pageIndex: number;
  token: string;
}): Promise<Response> {
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
}

export async function collectItems(
  pageSize: number,
  updateToast: (count: number, currentSize: number, totalSize: number) => void,
  finishToast: (ok: boolean, finalCount: number) => void
): Promise<any[]> {
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
      updateToast(results.length, results.length, data.totalElements);

      if (items.length < pageSize) {
        finishToast(true, results.length);
        break;
      }

      pageIndex += 1;
    } catch (e) {
      console.warn("요청 중 예외 발생 - 중단합니다.", e);
      finishToast(false, results.length);
      break;
    }
  }
  return results;
}
