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

export function getCookieValue(key: string): string {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`))
      ?.split("=")[1] || ""
  );
}

export function isCoupangProductUrl(href: string): boolean {
  try {
    const u = new URL(href, location.origin);
    return /\/vp\/products\/\d+/.test(u.pathname);
  } catch {
    return false;
  }
}

export function getPidFromLocation(): string | null {
  const m =
    location.pathname.match(/\/products\/(\d+)/) ||
    location.href.match(/\/products\/(\d+)/);
  return m ? m[1] : null;
}
