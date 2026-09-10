// 验证 R2 线上的 resources.json 是否已修复：node scripts/verify-r2-fix.mjs
const r = await fetch("https://cdn.nobg.org/resources.json", { cache: "no-store" });
console.log("status:", r.status);
const map = await r.json();
const q = map["/models/isnet_quint8"].chunks[0];
console.log("quint8 chunk0:", JSON.stringify(q).slice(0, 140));
const hasName = Object.values(map).every((e) => e.chunks.every((c) => !!c.name));
console.log("all chunks have name:", hasName);
