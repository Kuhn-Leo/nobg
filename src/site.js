// 全站配置：域名与品牌只需改这一处
export const SITE_URL = "https://nobg.org";
export const SITE_NAME = "NoBg";

// AI 模型配置：quint8 量化版约 40MB（fp16 约 80MB），自托管在 Cloudflare R2（cdn.nobg.org）
// 下载流量免费、国内可达性好。如需切回官方 CDN，删除 publicPath 即可
export const AI_CONFIG = {
  device: "cpu",
  model: "isnet_quint8",
  publicPath: "https://cdn.nobg.org/",
};

export function pathFor(lang, usecase) {
  const prefix = lang === "en" ? "" : `/${lang}`;
  const seg = usecase ? `/${usecase.slug}` : "";
  return `${prefix}${seg}/` || "/";
}
