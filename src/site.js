// 全站配置：域名与品牌只需改这一处
export const SITE_URL = "https://nobg.org";
export const SITE_NAME = "NoBg";

// AI 模型配置：quint8 量化版约 22MB（fp16 约 44MB），下载减半、质量轻微下降
// 如需切回高质量模型，改为 "isnet_fp16"
export const AI_CONFIG = { device: "cpu", model: "isnet_quint8" };

export function pathFor(lang, usecase) {
  const prefix = lang === "en" ? "" : `/${lang}`;
  const seg = usecase ? `/${usecase.slug}` : "";
  return `${prefix}${seg}/` || "/";
}
