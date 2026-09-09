// Adsterra 广告配置（已填入全部单元）
// 收益排序：Social Bar ≈ Popunder > Banner > Native
// 注意：Banner 是 atOptions 全局变量模式，同页多个必须隔离在独立 iframe 中（见 App.jsx AtOptionsBanner）
export const ADS = {
  // Popunder：整站弹窗，平台默认 24 小时频控一次
  popunderScript:
    "https://pl31263461.profitableratecpmnetwork.com/1a/44/b1/1a44b17a6e9ba2f1dc2fed5f98664db2.js",

  // Social Bar：页内推送条，收益主力
  socialBarScript:
    "https://pl31263463.profitableratecpmnetwork.com/d4/c2/e3/d4c2e30790e8747688ed7e763a8168bb.js",

  // Banner 300×250：工具卡下方（全设备）
  banner300: {
    key: "d0436a70cdb37f0c48cc0083537df8f4",
    invoke: "https://www.highrevenueformat.com/d0436a70cdb37f0c48cc0083537df8f4/invoke.js",
    width: 300,
    height: 250,
  },

  // Banner 728×90：页脚上方（仅桌面端显示，移动端隐藏防溢出）
  banner728: {
    key: "f26e4da812134d6c136413b831b3ed45",
    invoke: "https://www.highrevenueformat.com/f26e4da812134d6c136413b831b3ed45/invoke.js",
    width: 728,
    height: 90,
  },

  // Native Banner：FAQ 前内容区
  nativeScript:
    "https://pl31263462.profitableratecpmnetwork.com/f924f08ff5fb9cbb332d6f5b92b82feb/invoke.js",
  nativeContainerId: "container-f924f08ff5fb9cbb332d6f5b92b82feb",
};

const loaded = new Set();

export function injectAdScript(src) {
  if (!src || loaded.has(src)) return;
  const s = document.createElement("script");
  s.type = "text/javascript";
  s.async = true;
  s.setAttribute("data-cfasync", "false");
  s.src = src.startsWith("//") ? src : "//" + src;
  document.body.appendChild(s);
  loaded.add(src);
}

// 全局脚本类广告（Popunder / Social Bar）：延迟注入——
// 等用户首次交互或停留 8 秒后再加载，避免拖慢首屏和影响 SEO 评分
export function initGlobalAds() {
  if (typeof window === "undefined") return;
  if (!ADS.popunderScript && !ADS.socialBarScript) return;

  let started = false;
  const cleanup = () => {
    window.removeEventListener("pointerdown", start);
    window.removeEventListener("keydown", start);
    clearTimeout(timer);
  };
  const start = () => {
    if (started) return;
    started = true;
    if (ADS.popunderScript) injectAdScript(ADS.popunderScript);
    if (ADS.socialBarScript) injectAdScript(ADS.socialBarScript);
    cleanup();
  };
  const timer = setTimeout(start, 8000);
  window.addEventListener("pointerdown", start, { once: true });
  window.addEventListener("keydown", start, { once: true });
}
