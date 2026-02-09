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
    .ct-prodinfo .wrap{position:relative;display:flex;flex-wrap:wrap;gap:10px;padding:12px 14px;border-radius:12px;background:rgba(28,28,30,.86);color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.22);backdrop-filter:saturate(140%) blur(10px);-webkit-backdrop-filter:saturate(140%) blur(10px);border:1px solid rgba(255,255,255,.12);overflow:visible}
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
    .ct-price-warn{color:#ff9500;cursor:help;font-size:13px;margin-left:4px;z-index:999999}
    .ct-prodinfo .ct-warn-tooltip{display:none;position:absolute;bottom:calc(100% + 8px);left:0;right:0;padding:10px 12px;background:rgba(120,60,0,.95);border:1px solid rgba(255,149,0,.5);color:#ffd080;z-index:999999;box-sizing:border-box;font-size:12px;font-weight:500;line-height:1.5;white-space:normal;border-radius:8px;pointer-events:none}
    .ct-prodinfo .ct-warn-tooltip::before{content:"";position:absolute;top:100%;right:48px;border:7px solid transparent;border-top-color:rgba(255,149,0,.5)}
    .ct-prodinfo .ct-warn-tooltip::after{content:"";position:absolute;top:100%;right:49px;border:6px solid transparent;border-top-color:rgba(120,60,0,.95)}
    .ct-price-warn:hover .ct-warn-tooltip{display:block}
    .ct-option-toggle{pointer-events:auto;background:rgba(255,149,0,.15);border:1px solid rgba(255,149,0,.4);color:#ff9500;font-size:11px;font-weight:600;cursor:pointer;padding:5px 10px;border-radius:6px;text-align:center;width:100%;margin-top:2px;transition:background .15s,border-color .15s}
    .ct-option-toggle:hover{background:rgba(255,149,0,.28);border-color:rgba(255,149,0,.6);color:#ffb340}
    .ct-dialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999999;display:flex;align-items:center;justify-content:center;pointer-events:auto}
    .ct-dialog{background:rgba(28,28,30,.96);border:1px solid rgba(255,255,255,.15);border-radius:14px;box-shadow:0 16px 48px rgba(0,0,0,.4);backdrop-filter:saturate(140%) blur(20px);-webkit-backdrop-filter:saturate(140%) blur(20px);color:#fff;width:380px;max-width:90vw;max-height:80vh;display:flex;flex-direction:column;overflow:hidden}
    .ct-dialog-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;font-size:16px;font-weight:700;border-bottom:1px solid rgba(255,255,255,.1)}
    .ct-dialog-desc{padding:12px 16px;font-size:13px;font-weight:500;line-height:1.6;color:#ffd080;background:rgba(255,149,0,.12);border-left:3px solid #ff9500;border-bottom:1px solid rgba(255,149,0,.25)}
    .ct-dialog-close{background:none;border:none;color:rgba(255,255,255,.6);font-size:16px;cursor:pointer;padding:0 2px;line-height:1}
    .ct-dialog-close:hover{color:#fff}
    .ct-dialog-body{padding:12px 16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto}
    .ct-dialog-row{display:flex;flex-direction:column;gap:4px;padding:8px 10px;background:rgba(255,255,255,.05);border-radius:8px}
    .ct-dialog-opt-info{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
    .ct-dialog-opt-name{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1}
    .ct-dialog-opt-price{font-size:14px;opacity:.8;white-space:nowrap;flex:0 0 auto}
    .ct-dialog-opt-control{display:flex;align-items:center;gap:8px}
    .ct-opt-slider{flex:1 1 0;min-width:30px;height:4px;-webkit-appearance:none;appearance:none;background:rgba(255,255,255,.2);border-radius:2px;outline:none;cursor:pointer;touch-action:none}
    .ct-opt-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#ff9500;cursor:pointer}
    .ct-opt-ratio{flex:0 0 34px;text-align:right;font-weight:600;font-size:14px}
    .ct-opt-link{color:#4f86ff;text-decoration:none;font-size:13px;align-self:flex-end}
    .ct-opt-link:hover{text-decoration:underline}
    .ct-dialog-footer{display:flex;justify-content:space-between;align-items:center;padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,.1)}
    .ct-dialog-revenue{font-size:15px;font-weight:700;color:#ff9500}
    .ct-opt-reset-btn{pointer-events:auto;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.8);font-size:11px;padding:4px 12px;border-radius:6px;cursor:pointer}
    .ct-opt-reset-btn:hover{background:rgba(255,255,255,.2)}
    @media (prefers-color-scheme: light){
      .ct-prodinfo .wrap{background:rgba(20,20,20,.84)}
      .ct-prodinfo .chip.pv{background:rgba(0,122,255,.14);color:#0a84ff;border-color:rgba(0,122,255,.35);text-shadow:none}
      .ct-prodinfo .chip.sales{background:rgba(255,149,0,.16);color:#ff9500;border-color:rgba(255,149,0,.35);text-shadow:none}
      .ct-prodinfo .chip.rate{background:rgba(52,199,89,.16);color:#34c759;border-color:rgba(52,199,89,.35);text-shadow:none}
    }
  `;
  document.head.appendChild(style);
}
