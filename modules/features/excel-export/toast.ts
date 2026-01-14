/**
 * Excel Export Toast
 *
 * Progress toast for Excel export operations
 */

import { STYLE_IDS } from '@/modules/constants/selectors';

/**
 * Ensure toast element and styles exist
 */
export function ensureToast() {
  if (document.getElementById('ct-toast')) return;

  const styleId = STYLE_IDS.TOAST;
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
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

  const wrap = document.createElement('div');
  wrap.id = 'ct-toast';
  wrap.style.width = '200px';
  wrap.style.height = '80px';
  wrap.style.boxSizing = 'border-box';
  wrap.style.overflow = 'hidden';
  wrap.innerHTML = `
    <div class="ct-title">수집 진행 중…</div>
    <div class="ct-sub">수집: <span id="ct-count">0</span> / <span id="ct-total">0</span>개</div>
    <div class="ct-bar" id="ct-bar"></div>
  `;
  document.body.appendChild(wrap);
}

/**
 * Update toast with current progress
 */
export function updateToast(count: number, currentSize: number, totalSize: number) {
  ensureToast();
  const c = document.getElementById('ct-count');
  const total = document.getElementById('ct-total');
  const bar = document.getElementById('ct-bar') as HTMLDivElement | null;

  if (c) c.textContent = String(count);
  if (total) total.textContent = String(totalSize);
  if (bar) {
    const ratio = Math.max(0, Math.min(1, currentSize / totalSize));
    bar.style.transform = `scaleX(${ratio || 0.1})`;
  }
}

/**
 * Finish toast with final state
 */
export function finishToast(ok: boolean, finalCount: number) {
  ensureToast();
  const t = document.getElementById('ct-toast');
  if (!t) return;

  if (!ok) t.classList.add('ct-error');

  const title = t.querySelector('.ct-title');
  const sub = t.querySelector('.ct-sub');
  if (title) title.textContent = ok ? '수집 완료' : '수집 중단';
  if (sub) sub.textContent = `총 ${finalCount}개`;

  const bar = document.getElementById('ct-bar');
  if (bar) (bar as HTMLDivElement).style.transform = 'scaleX(1)';

  setTimeout(() => t.remove(), 2500);
}
