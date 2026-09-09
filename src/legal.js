// 法务页面：服务条款 / 隐私政策（MVP 初版，正式法律文本发布前请做专业审核）
export const LEGAL_PAGES = [
  {
    slug: "terms",
    zh: {
      title: "服务条款 | NoBg",
      desc: "NoBg 服务条款：个人使用免费、服务按现状提供、功能与定价可能调整。",
      h1: "服务条款",
      updated: "最后更新：2026 年 9 月",
      body: [
        ["服务说明", "NoBg（下称“本服务”）是一款在浏览器本地运行 AI 模型、为用户提供图片背景移除功能的在线工具。图片处理过程在用户设备上完成，图片不会被上传至本站服务器。"],
        ["免费与付费", "个人使用的核心抠图功能永久免费，无需注册。我们未来可能推出付费订阅，仅覆盖高清批量导出等进阶功能；已有的免费功能不会转为收费。"],
        ["服务按现状提供", "本服务按“现状”提供，不对处理结果的适用性、准确性作任何明示或默示的保证。因使用本服务产生的任何直接或间接损失，本站不承担责任。"],
        ["用户内容与行为", "你保证拥有所处理图片的合法权利，不得利用本服务处理违法内容或侵犯他人权益的内容。"],
        ["条款变更", "我们可能随服务发展更新本条款，重大变更会在本页面公布。继续使用即视为接受更新后的条款。"],
      ],
      note: "本页面为产品早期版本条款。在正式商业化（付费功能上线）前，建议对本文做专业法律审核。",
    },
    en: {
      title: "Terms of Service | NoBg",
      desc: "NoBg Terms of Service: free for personal use, provided as-is, features and pricing may change.",
      h1: "Terms of Service",
      updated: "Last updated: September 2026",
      body: [
        ["The Service", "NoBg (the \"Service\") is an online tool that runs AI models locally in your browser to remove image backgrounds. Images are processed on your device and are never uploaded to our servers."],
        ["Free & Paid", "Core background removal is free for personal use, forever, with no signup. We may introduce paid subscriptions in the future covering only advanced features such as HD batch export. Existing free features will never become paid."],
        ["As-Is", "The Service is provided \"as is\" without warranties of any kind. We are not liable for any direct or indirect damages arising from use of the Service."],
        ["Your Content", "You represent that you own the rights to images you process and will not use the Service for unlawful or infringing content."],
        ["Changes", "These terms may be updated as the Service evolves. Material changes will be posted on this page. Continued use constitutes acceptance."],
      ],
      note: "This is an early-stage document. Please have it professionally reviewed before commercial launch.",
    },
  },
  {
    slug: "privacy",
    zh: {
      title: "隐私政策 | NoBg",
      desc: "NoBg 隐私政策：图片全程在浏览器本地处理，不上传服务器；我们不收集个人数据。",
      h1: "隐私政策",
      updated: "最后更新：2026 年 9 月",
      body: [
        ["你的图片", "你使用本服务处理的图片全程保留在你的设备上。抠图由浏览器内的 AI 模型完成，图片不会经过或存储于任何服务器。"],
        ["我们收集什么", "本服务当前不收集任何个人身份信息。首次使用会从 CDN 下载 AI 模型并缓存在浏览器本地（Cache API），该缓存仅包含公开的模型文件。"],
        ["本地存储", "浏览器缓存仅用于加速模型加载，你可随时通过浏览器设置清除。清除后下次使用会重新下载模型。"],
        ["第三方服务", "AI 模型文件由第三方 CDN（staticimgly.com）分发，下载过程中该 CDN 可见到你的 IP 地址等标准网络信息，详见其自身隐私政策。"],
        ["广告说明", "本站通过第三方广告网络（Adsterra）展示广告。广告合作伙伴可能使用 Cookie 或类似技术在您的浏览器中投放广告，相关数据处理受其自身隐私政策约束。您可以通过浏览器设置或广告偏好工具管理个性化广告。"],
        ["政策变更", "若未来引入统计或付费功能导致数据处理方式变化，我们会在本页面更新说明。"],
      ],
      note: "本页面为产品早期版本隐私政策。接入支付或统计服务前，请更新并做专业审核。",
    },
    en: {
      title: "Privacy Policy | NoBg",
      desc: "NoBg Privacy Policy: images are processed locally in your browser and never uploaded; we collect no personal data.",
      h1: "Privacy Policy",
      updated: "Last updated: September 2026",
      body: [
        ["Your Images", "Images you process stay on your device at all times. Background removal is performed by an AI model inside your browser — images never pass through or rest on any server."],
        ["What We Collect", "The Service currently collects no personal information. On first use, an AI model is downloaded from a CDN and cached locally in your browser (Cache API). The cache contains only public model files."],
        ["Local Storage", "Browser caches exist solely to speed up model loading and can be cleared anytime in your browser settings. Clearing them means the model is re-downloaded next time."],
        ["Third Parties", "AI model files are delivered by a third-party CDN (staticimgly.com). Standard network information such as your IP address is visible to that CDN during download; see their own privacy policy."],
        ["Advertising", "This site displays ads via the third-party network Adsterra. Ad partners may use cookies or similar technologies to serve ads in your browser; such data handling is governed by their own privacy policies. You can manage personalized ads via your browser settings or ad preference tools."],
        ["Changes", "If future analytics or payment features change how data is handled, we will update this page."],
      ],
      note: "This is an early-stage privacy policy. Update and professionally review it before integrating payments or analytics.",
    },
  },
];
