import { STYLE_IDS } from "@/modules/constants/selectors";

export function ensureHelloStyle() {
  if (document.getElementById(STYLE_IDS.HELLO)) return;

  const style = document.createElement("style");
  style.id = STYLE_IDS.HELLO;
  style.textContent = `
    .ct-hello{position:fixed;top:16px;right:16px;z-index:2147483646;padding:10px 14px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.18);color:#fff;font-weight:700;font-size:14px;line-height:1.2;pointer-events:none}
    .ct-hello.blue{background:linear-gradient(135deg,#4f86ff,#2b6eff)}
    .ct-hello.local{position:absolute;top:0;right:0;transform:translateY(-110%);pointer-events:none}
    .ct-hello.inline{position:static;display:block;margin:8px 0 12px auto;max-width:max-content;pointer-events:auto}
    .ct-prodinfo{position:static;display:block;margin:10px 0 14px 0;max-width:100%;pointer-events:auto}
    .ct-prodinfo .wrap{display:flex;flex-wrap:wrap;gap:10px;padding:12px 14px;border-radius:12px;background:rgba(28,28,30,.86);color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.22);backdrop-filter:saturate(140%) blur(10px);-webkit-backdrop-filter:saturate(140%) blur(10px);border:1px solid rgba(255,255,255,.12)}
    .ct-prodinfo .row{display:flex;gap:8px;justify-content:space-between;align-items:baseline;width:100%;font-size:13px;line-height:1.5}
    .ct-prodinfo .label{opacity:.85}
    .ct-prodinfo .value{font-weight:700;letter-spacing:-.01em}
    .ct-prodinfo .chip{display:inline-block;padding:3px 10px;border-radius:9999px;font-weight:700;font-size:12px;line-height:1.25;border:1px solid transparent}
    .ct-prodinfo .chip.pv{background:rgba(0,122,255,.35);color:#fff;border-color:rgba(0,122,255,.6);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-prodinfo .chip.sales{background:rgba(255,149,0,.34);color:#fff;border-color:rgba(255,149,0,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-prodinfo .chip.rate{background:rgba(52,199,89,.32);color:#fff;border-color:rgba(52,199,89,.55);text-shadow:0 1px 0 rgba(0,0,0,.15)}
    .ct-prodinfo .sub{width:100%;text-align:right;font-size:11px;opacity:.75;margin-top:2px}
    .ct-prodinfo.compact .wrap{padding:8px 10px;gap:6px}
    .ct-prodinfo.compact .line{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
    .ct-prodinfo.compact .kv{display:inline-flex;gap:6px;align-items:baseline;font-size:12px;line-height:1.35}
    .ct-prodinfo.compact .kv .label{opacity:.8}
    .ct-prodinfo.compact .sep{opacity:.4}
    .ct-prodinfo .retry-btn{pointer-events:auto;position:relative;z-index:10;background:#2b6eff;color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border:none;border-radius:6px;cursor:pointer;margin-left:12px}
    .ct-prodinfo .retry-btn:hover{background:#1f54c7}
    @media (prefers-color-scheme: light){
      .ct-prodinfo .wrap{background:rgba(20,20,20,.84)}
      .ct-prodinfo .chip.pv{background:rgba(0,122,255,.14);color:#0a84ff;border-color:rgba(0,122,255,.35);text-shadow:none}
      .ct-prodinfo .chip.sales{background:rgba(255,149,0,.16);color:#ff9500;border-color:rgba(255,149,0,.35);text-shadow:none}
      .ct-prodinfo .chip.rate{background:rgba(52,199,89,.16);color:#34c759;border-color:rgba(52,199,89,.35);text-shadow:none}
    }
  `;
  document.head.appendChild(style);
}
