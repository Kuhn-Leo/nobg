// Adsterra 广告配置
// 使用方法：在 Adsterra 后台为 nobg.org 创建对应格式的广告单元，
// 把每个单元代码里 <script src="//xxx/invoke.js"> 的地址粘贴到下面，自动生效。
// 某项留空 = 该广告位不展示。
export const ADS = {
  // Popunder：整站弹窗（平台默认 24 小时频控一次），收益最高
  popunderScript: "",

  // Social Bar：页内推送条，收益高且不遮挡工具区，强烈建议启用
  socialBarScript: "",

  // Banner：工具卡下方的横幅（后台选 728x90 或 300x250）
  bannerBelowTool: "",

  // Native Banner：内容流广告（放在 FAQ 前）
  nativeScript: "",
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
  const start = () => {
    if (started) return;
    started = true;
    if (ADS.popunderScript) injectAdScript(ADS.popunderScript);
    if (ADS.socialBarScript) injectAdScript(ADS.socialBarScript);
    cleanup();
  };
  const cleanup = () => {
    window.removeEventListener("pointerdown", start);
    window.removeEventListener("keydown", start);
    clearTimeout(timer);
  };
  const timer = setTimeout(start, 8000);
  window.addEventListener("pointerdown", start, { once: true });
  window.addEventListener("keydown", start, { once: true });
}

// 从 invoke.js 地址推断 Banner 容器 id（Adsterra 约定：container-<key>）
export function bannerContainerId(invokeSrc) {
  const seg = invokeSrc.split("/").filter(Boolean);
  return "container-" + (seg[seg.length - 2] || "unknown");
}
