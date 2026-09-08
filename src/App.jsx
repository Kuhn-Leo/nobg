import { useCallback, useEffect, useRef, useState } from "react";
import { removeBackground, preload } from "@imgly/background-removal";
import { i18n } from "./i18n.js";
import { SITE_URL, SITE_NAME, pathFor } from "./site.js";
import { LANGS } from "./langs.js";
import { USECASES } from "./usecases.js";
import { LEGAL_PAGES } from "./legal.js";
import { initGA, trackPageview } from "./ga.js";

const MAX_SIZE = 20 * 1024 * 1024;

/* ---------- routing ---------- */

const NON_EN_PREFIX = new RegExp(`^\\/(${LANGS.filter((l) => l.code !== "en").map((l) => l.code).join("|")})(\\/.*)?$`);

function parseRoute() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const m = path.match(NON_EN_PREFIX);
  const lang = m ? m[1] : "en";
  const rest = m ? m[2] || "/" : path;
  const seg = rest.replace(/^\//, "").split("/")[0];
  const usecase = [...USECASES, ...LEGAL_PAGES].find((u) => u.slug === seg) || null;
  return { lang, usecase };
}

function useRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const onPop = () => setRoute(parseRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return route;
}

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href, hreflang) {
  const key = hreflang ? `${rel}:${hreflang}` : rel;
  let el = document.head.querySelector(`link[data-seo="${key}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute("data-seo", key);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  if (hreflang) el.setAttribute("hreflang", hreflang);
}

/* ---------- compare slider ---------- */

function CompareSlider({ before, after, lang }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const update = useCallback((clientX) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.min(96, Math.max(4, pct)));
  }, []);

  useEffect(() => {
    const move = (e) => dragging.current && update(e.clientX);
    const up = () => (dragging.current = false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [update]);

  return (
    <div
      className="compare"
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        update(e.clientX);
      }}
    >
      <img className="compare-img" src={before} alt="original" draggable="false" />
      <div className="compare-after" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
        <img className="compare-img" src={after} alt="background removed" draggable="false" />
      </div>
      <div className="compare-handle" style={{ left: `${pos}%` }}>
        <div className="compare-line" />
        <div className="compare-knob">↔</div>
      </div>
      <span className="compare-tag compare-tag-l">{lang === "zh" ? "原图" : "Before"}</span>
      <span className="compare-tag compare-tag-r">{lang === "zh" ? "抠图后" : "After"}</span>
    </div>
  );
}

/* ---------- loading 动画：对比滑块切割示意 ---------- */

function CutLoader() {
  return (
    <div className="cut-loader" aria-hidden="true">
      <div className="cl-left" />
      <div className="cl-person">🧍</div>
      <div className="cl-right" />
      <div className="cl-line" />
      <div className="cl-knob" />
    </div>
  );
}

/* ---------- app ---------- */

export default function App() {
  const route = useRoute();
  const { lang } = route;
  const uc = route.usecase;
  const home = i18n[lang];
  // 首页没有独立的 h1 字段，复用 heroTitle；法务页未翻译的语言回退到英文
  const t = uc ? (uc[lang] || uc.en) : { ...home, h1: home.heroTitle };

  const [phase, setPhase] = useState("idle"); // idle | processing | done | error
  const [srcUrl, setSrcUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const srcBlob = useRef(null);

  /* GA init（必须先于 trackPageview 的 effect 声明） */
  useEffect(() => {
    initGA();
  }, []);

  /* 进页面 2 秒后后台预加载 AI 模型：用户挑图的时间正好覆盖下载，
     首次使用体感从"选完图等几分钟"变成"直接出结果"。已缓存的会瞬间跳过。 */
  useEffect(() => {
    const timer = setTimeout(() => {
      preload({ device: "cpu" }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  /* per-page head: title / description / canonical / hreflang / JSON-LD */
  useEffect(() => {
    trackPageview(window.location.pathname + window.location.search);
    document.title = t.title;
    setMeta("name", "description", t.desc);
    setMeta("property", "og:title", t.title);
    setMeta("property", "og:description", t.desc);
    const canonicalPath = pathFor(lang, uc);
    setLink("canonical", SITE_URL + (canonicalPath === "/" ? "/" : canonicalPath));
    setLink("alternate", SITE_URL + pathFor("zh", uc), "zh");
    setLink("alternate", SITE_URL + pathFor("en", uc), "en");
    if (t.steps) {
      const ld = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: t.h1,
        description: t.desc,
        step: t.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, text: s })),
      };
      let script = document.getElementById("ld-howto");
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = "ld-howto";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(ld);
    }
  }, [lang, uc, t]);

  const process = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > MAX_SIZE) {
        setErrorMsg(i18n[lang].errorTooLarge);
        setPhase("error");
        return;
      }
      srcBlob.current = file;
      const url = URL.createObjectURL(file);
      setSrcUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      setResultUrl(null);
      setProgress(0);
      setPhase("processing");
      try {
        // 模型 CDN 下载偶发中断，自动重试（已下载完成的文件有浏览器缓存，重试不白费）
        let blob = null;
        const MAX_TRIES = 3;
        for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
          try {
            blob = await removeBackground(file, {
              device: "cpu", // WebGPU 在部分环境（IDE 内置浏览器/旧驱动）下会崩溃，稳定优先
              progress: (key, current, total) => {
                if (total > 0) setProgress(Math.round((current / total) * 100));
              },
              output: { format: "image/png" },
            });
            break;
          } catch (err) {
            if (attempt === MAX_TRIES) throw err;
            setProgress(0);
            await new Promise((r) => setTimeout(r, 1500 * attempt));
          }
        }
        setResultUrl(URL.createObjectURL(blob));
        setPhase("done");
      } catch (err) {
        console.error(err);
        setErrorMsg(i18n[lang].error);
        setPhase("error");
      }
    },
    [lang]
  );

  const reset = useCallback(() => {
    setPhase("idle");
    setResultUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    setSrcUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }, []);

  const download = useCallback(() => {
    if (!resultUrl || !srcBlob.current) return;
    const base = srcBlob.current.name.replace(/\.[^.]+$/, "") || "image";
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = base + t.fileNameSuffix;
    a.click();
  }, [resultUrl, t]);

  /* clipboard paste support */
  useEffect(() => {
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (item) process(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [process]);

  const busy = phase === "processing";

  return (
    <div className="page">
      <header className="nav">
        <a className="nav-brand" href={lang === "zh" ? "/" : "/en/"}>
          <img className="nav-logo" src="/logo.svg" alt="" width="26" height="26" />
          {SITE_NAME}
        </a>
        <nav className="nav-badges">
          <span className="badge">✓ {home.navFree}</span>
          <span className="badge">✓ {home.navNoSignup}</span>
          <span className="badge">✓ {home.navPrivate}</span>
          <select
            className="lang-select"
            value={lang}
            onChange={(e) => (window.location.href = pathFor(e.target.value, uc))}
            aria-label="Language"
          >
            {LANGS.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </nav>
      </header>

      <main>
        <section className="hero">
          <h1>
            {t.h1.split("，").length > 1 ? (
              <>
                {t.h1.split("，")[0]}，
                <span className="grad">{t.h1.split("，")[1]}</span>
              </>
            ) : (
              <span className="grad">{t.h1}</span>
            )}
          </h1>
          <p className="hero-sub">{uc ? t.sub : home.heroSub}</p>
        </section>

        <section className="tool card">
          {phase === "idle" && (
            <div
              className={`dropzone ${dragOver ? "dropzone-over" : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                process(e.dataTransfer.files?.[0]);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            >
              <div className="drop-icon">🖼️</div>
              <div className="drop-title">{home.dropTitle}</div>
              <div className="drop-or">{home.dropOr}</div>
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileRef.current?.click();
                }}
              >
                {home.dropButton}
              </button>
              <div className="drop-paste">{home.dropPaste}</div>
              <div className="drop-hint">{home.dropHint}</div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  process(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {busy && (
            <div className="processing">
              <div className="proc-visual">
                <img className="proc-thumb" src={srcUrl} alt="processing" />
                <CutLoader />
              </div>
              <div className="proc-body">
                <div className="proc-label">{progress > 0 && progress < 100 ? home.processingFirst : home.processing}</div>
                <div className="bar">
                  <div className="bar-fill" style={{ width: `${Math.max(progress, 8)}%` }} />
                </div>
                <div className="proc-pct">{progress}%</div>
              </div>
            </div>
          )}

          {phase === "done" && srcUrl && resultUrl && (
            <div className="result">
              <div className="result-label">{home.done}</div>
              <CompareSlider before={srcUrl} after={resultUrl} lang={lang} />
              <div className="result-actions">
                <button className="btn btn-primary btn-lg" onClick={download}>
                  ⬇ {home.download}
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  {home.newImage}
                </button>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="error-box">
              <div className="error-icon">⚠️</div>
              <div>{errorMsg}</div>
              <button className="btn btn-ghost" onClick={reset}>
                {home.newImage}
              </button>
            </div>
          )}
        </section>

        {/* 用例内链（SEO：每页可见，爬虫可发现全部落地页） */}
        <section className="usecase-links" aria-label={lang === "zh" ? "更多用例" : "More use cases"}>
          {USECASES.map((u) => (
            <a
              key={u.slug}
              className={`usecase-chip ${uc === u ? "usecase-chip-active" : ""}`}
              href={pathFor(lang, u)}
            >
              {u.chip[lang] || u.chip.en}
            </a>
          ))}
        </section>

        {uc && t.steps && (
          <section className="card steps">
            <h2>{t.stepsTitle}</h2>
            <ol className="steps-list">
              {t.steps.map((s, i) => (
                <li key={i}>
                  <span className="step-num">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        )}

        {uc && t.faqs && (
          <section className="card seo">
            <h2>{home.faqTitle}</h2>
            {t.faqs.map(([q, a]) => (
              <details key={q} className="faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        )}

        {uc && t.body && (
          <section className="card seo">
            <h2>{t.h1}</h2>
            <p className="legal-updated">{t.updated}</p>
            {t.body.map(([h, p]) => (
              <div key={h}>
                <h3 className="legal-h3">{h}</h3>
                <p>{p}</p>
              </div>
            ))}
            <p className="legal-note">{t.note}</p>
          </section>
        )}

        <section className="features">
          <div className="card feature">
            <div className="feature-icon">🎁</div>
            <h3>{home.feat1Title}</h3>
            <p>{home.feat1Desc}</p>
          </div>
          <div className="card feature">
            <div className="feature-icon">🔒</div>
            <h3>{home.feat2Title}</h3>
            <p>{home.feat2Desc}</p>
          </div>
          <div className="card feature">
            <div className="feature-icon">✨</div>
            <h3>{home.feat3Title}</h3>
            <p>{home.feat3Desc}</p>
          </div>
        </section>

        {!uc && (
          <section className="seo card">
            <h2>{home.seoTitle}</h2>
            <p>{home.seoP1}</p>
            <p>{home.seoP2}</p>
            <h2>{home.faqTitle}</h2>
            {[
              [home.faq1Q, home.faq1A],
              [home.faq2Q, home.faq2A],
              [home.faq3Q, home.faq3A],
              [home.faq4Q, home.faq4A],
            ].map(([q, a]) => (
              <details key={q} className="faq">
                <summary>{q}</summary>
                <p>{a}</p>
              </details>
            ))}
          </section>
        )}
      </main>

      <footer className="footer">
        {home.footer}
        <div className="footer-links">
          <a href={pathFor(lang, LEGAL_PAGES[0])}>{home.footerTerms}</a>
          <span>·</span>
          <a href={pathFor(lang, LEGAL_PAGES[1])}>{home.footerPrivacy}</a>
        </div>
      </footer>
    </div>
  );
}
