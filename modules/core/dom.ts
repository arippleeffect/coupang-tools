/**
 * 함수 실행을 지연시키는 디바운스
 * @param fn - 디바운스할 함수
 * @param wait - 대기 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait = 150
) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
}

/**
 * DOM 요소가 나타날 때까지 대기
 * @param selector - CSS 셀렉터
 * @param timeout - 타임아웃 (밀리초)
 * @returns 찾은 요소
 */
export function waitForElement(
  selector: string,
  timeout = 8000
): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) return resolve(existing);

    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    if (timeout > 0) {
      setTimeout(() => {
        obs.disconnect();
        reject(new Error(`waitForElement timeout: ${selector}`));
      }, timeout);
    }
  });
}

/**
 * 쿠키 값 조회
 * @param key - 쿠키 키
 * @returns 쿠키 값
 */
export function getCookieValue(key: string): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`))
      ?.split("=")[1] || ""
  );
}

/**
 * 쿠팡 상품 URL 여부 확인
 * @param href - 확인할 URL
 * @returns 쿠팡 상품 URL 여부
 */
export function isCoupangProductUrl(href: string): boolean {
  try {
    const u = new URL(href, location.origin);
    return /\/vp\/products\/\d+/.test(u.pathname);
  } catch {
    return false;
  }
}

/**
 * 현재 페이지에서 상품 ID 추출
 * @returns 상품 ID 또는 null
 */
export function getPidFromLocation(): string | null {
  const m =
    location.pathname.match(/\/products\/(\d+)/) ||
    location.href.match(/\/products\/(\d+)/);
  return m ? m[1] : null;
}
