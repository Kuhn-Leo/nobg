// 从语言注册表和页面数据自动生成 public/sitemap.xml：node scripts/gen-sitemap.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SITE_URL, pathFor } from "../src/site.js";
import { LANGS } from "../src/langs.js";
import { USECASES } from "../src/usecases.js";
import { LEGAL_PAGES } from "../src/legal.js";

const pages = ["", ...USECASES.map((u) => u.slug), ...LEGAL_PAGES.map((p) => p.slug)];

const esc = (u) => u.replace(/&/g, "&amp;");
// 首页 slug 为空，必须传 null（pathFor 对空 slug 会拼出双斜杠）
const clean = (u) => esc((SITE_URL + u).replace(/([^:])\/{2,}/g, "$1/"));
const urlEntries = pages
  .map((slug) => {
    const pseudo = slug ? { slug } : null;
    const alternates = LANGS.map(
      (l) => `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${clean(pathFor(l.code, pseudo))}"/>`
    ).join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${clean(pathFor("en", pseudo))}"/>`;
    return `  <url>\n    <loc>${clean(pathFor("en", pseudo))}</loc>\n${xDefault}\n${alternates}\n  </url>`;
  })
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- 自动生成：node scripts/gen-sitemap.mjs（请勿手改） -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries}
</urlset>
`;

writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "../public/sitemap.xml"), xml);
console.log(`sitemap.xml generated: ${pages.length} pages × ${LANGS.length} languages`);
