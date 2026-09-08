// 全站配置：域名与品牌只需改这一处
export const SITE_URL = "https://nobg.org";
export const SITE_NAME = "NoBg";

export function pathFor(lang, usecase) {
  const prefix = lang === "en" ? "" : `/${lang}`;
  const seg = usecase ? `/${usecase.slug}` : "";
  return `${prefix}${seg}/` || "/";
}
