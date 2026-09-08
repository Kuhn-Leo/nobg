// GA4 辅助：gtag 基础代码已静态写入 index.html（GA 检测器只认原始 HTML 里的片段）。
// 本模块只负责 SPA 场景下的补充上报和事件埋点，避免与首屏 PV 重复计数。

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-S5GJF24RF1";
const INITIAL_PATH =
  typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";

// 首屏 PV 由 index.html 的 gtag('config') 自动上报；仅当 SPA 内发生无刷新路由变化时才补发
export function trackPageview(path) {
  if (!GA_ID || !window.gtag) return;
  if (path === INITIAL_PATH) return;
  window.gtag("config", GA_ID, { page_path: path });
}

// 转化事件埋点（订阅付费上线后使用）：trackEvent('begin_checkout', {...})
export function trackEvent(name, params = {}) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("event", name, params);
}
