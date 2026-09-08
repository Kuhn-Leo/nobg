const CACHE = "nobgnow-v1";
const CDN_HOSTS = ["staticimgly.com"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(clients.claim()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // SPA navigation: network first, offline fallback to shell
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).catch(() => caches.match("/index.html")));
    return;
  }

  // runtime cache-first for app assets + AI model CDN
  const sameOrigin = url.origin === self.location.origin;
  const isCdn = CDN_HOSTS.some((h) => url.hostname.endsWith(h));
  if (!sameOrigin && !isCdn) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res && (res.ok || res.type === "opaque")) {
        try {
          cache.put(req, res.clone());
        } catch (_) {
          /* opaque responses may fail to put — ignore */
        }
      }
      return res;
    })
  );
});
