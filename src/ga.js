// Google Analytics 4 接入（对齐 wiki 站 inject-ga.js 的模式，Vite 原生实现）
// 用法：在 Vercel 项目环境变量中设置 VITE_GA_MEASUREMENT_ID（如 G-XXXXXXXXXX）
// 未设置时所有函数静默跳过，本地/预览环境零副作用。

// GA4 测量 ID（默认硬编码；如需覆盖可设置环境变量 VITE_GA_MEASUREMENT_ID）
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-S5GJF24RF1";

export function initGA() {
  if (!GA_ID || window.gtag) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // SPA：关闭自动 PV，由路由变化手动上报，避免重复计数
  window.gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageview(path) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("config", GA_ID, { page_path: path });
}

// 关键转化事件（后续接订阅付费时直接复用）
export function trackEvent(name, params = {}) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("event", name, params);
}
