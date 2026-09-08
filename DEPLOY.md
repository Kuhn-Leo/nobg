# NoBg（nobg.org）部署上线手册

**目标架构**（月成本 ≈ ¥0，与 wiki 站完全一致）：

```
Vercel（托管 + 构建 + HTTPS） ←─ DNS ─ Cloudflare（nobg.org 域名解析）
```

需要：Vercel 账号（已有，wiki 用过）+ Cloudflare 账号（域名已在里面）。预计耗时：20 分钟。

> 与 wiki 站流程的差异：这是 **Vite 项目**，Vercel 上要配置构建（wiki 部分页面是纯静态）。
> SPA 路由回退和缓存策略已由 `vercel.json` 配置好，无需额外操作。

---

## 第 1 步：代码推送到 GitHub（约 10 分钟）

```powershell
cd d:\developer\kuhn\remove-new
git init
git add .
git commit -m "Initial commit: NoBg free background remover (zh/en)"
git branch -M main
git remote add origin https://github.com/你的用户名/nobg.git
git push -u origin main
```

确认 `.gitignore` 生效：仓库里**不应**出现 `node_modules/` 和 `dist/`。

---

## 第 2 步：Vercel 导入项目（约 5 分钟）

1. 登录 [vercel.com](https://vercel.com) → **Add New** → **Project** → 选中 `nobg` 仓库 → Import；
2. Framework Preset 会自动识别为 **Vite**（`vercel.json` 已写死，不会识别错）：
   - Build Command：`npm run build`
   - Output Directory：`dist`
   - 无需任何环境变量；
3. **环境变量**（可选，接 GA 用）：Settings → Environment Variables → 添加
   `VITE_GA_MEASUREMENT_ID` = 你的 GA4 测量 ID（`G-XXXXXXXXXX`，GA 后台 → 数据流里获取）。
   不设置 = 不启用 GA，功能不受影响；
4. **Deploy**，等 1~2 分钟得到预览地址 `nobg-xxx.vercel.app`；
4. 打开预览地址验证：
   - ✅ 首页可打开，拖图 → 抠图 → 下载全流程可用
   - ✅ `/terms/`、`/privacy/`、`/id-photo/` 等路由直接刷新不 404（SPA 回退生效）

---

## 第 3 步：绑定主域名（约 10 分钟 + DNS 生效等待）

1. Vercel 项目 → **Settings** → **Domains** → 输入 `nobg.org` → Add；
2. 再加 `www.nobg.org`；
3. Vercel 会提示需要的 DNS 记录。到 Cloudflare 仪表盘 → `nobg.org` → **DNS** → 添加记录：
   - Type：`CNAME`，Name：`@`（Cloudflare 支持 CNAME 拉平到根域），Target：`cname.vercel-dns.com` → **灰云（DNS only）** → Save
   - Type：`CNAME`，Name：`www`，Target：`cname.vercel-dns.com` → 灰云 → Save
4. 回到 Vercel 等域名状态变 **Valid Configuration**，HTTPS 证书自动签发（几分钟）；
5. 验证 `https://nobg.org` 全流程可用。

> ⚠️ 记录用**灰云**（DNS only）：Vercel 自己签证书管 CDN，CF 橙云代理反而会造成双重 CDN 与重定向循环。Wiki 站若当时也是这么配的，保持一致即可。

---

## 第 4 步：搜索引擎上线（约 15 分钟）

1. **Google Search Console**：添加资源 → 选"网域" → `nobg.org` → 按提示在 Cloudflare DNS 加 TXT 记录验证（此时加 TXT 用橙云灰云都行）；
2. GSC 左侧 **Sitemaps** → 提交 `https://nobg.org/sitemap.xml`；
3. **Bing Webmaster Tools**：用 GSC 账号一键导入，同样提交 sitemap；
4. GSC"网址检查"手动请求编入索引：7 个语言首页（`/`、`/zh/`、`/es/`、`/pt/`、`/de/`、`/ja/`、`/id/`）+ 4 个用例页（共 28 个核心 URL，sitemap 里全有）。

**收录节奏目标**：9 月内完成收录 → 10 月关键词开始有展示 → **12 月 1 日 remove.bg 关闭日**吃流量峰值。

---

## 第 5 步：上线验收清单

- [ ] `https://nobg.org` HTTPS 正常，默认英文首页，抠图全流程可用（首次下载约 40MB 模型属正常）
- [ ] `/zh/` 及 4 个用例页 × 2 语言（英文在根、中文在 /zh/）直接刷新均不 404
- [ ] `https://nobg.org/sitemap.xml`、`/robots.txt` 可访问且域名正确
- [ ] `www.nobg.org` 正常访问（或 301 到裸域）
- [ ] 手机端拖拽上传与下载正常
- [ ] GSC 已验证、sitemap 已提交、无抓取报错

---

## 后续维护

```powershell
# 改完代码后
git add .
git commit -m "更新内容"
git push
```

push 后 Vercel 自动重新部署（约 1 分钟），无需其他操作。

**已知优化项**（不阻塞上线）：
- AI 模型目前从第三方 CDN（staticimgly.com）下载，偶发中断已有自动重试兜底；后续可把模型迁到 Cloudflare R2 或 Vercel 静态资源，彻底消除依赖
- GA 已预留接入（`src/ga.js` + Vercel 环境变量 `VITE_GA_MEASUREMENT_ID`），**启用后记得更新 `/privacy/` 页面**声明数据收集
- 二期：订阅付费（Stripe/LemonSqueezy）、Chrome 扩展、更多用例落地页
