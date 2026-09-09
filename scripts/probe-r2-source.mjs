// 探测 CDN 分片下载：node scripts/probe-r2-source.mjs
const base = "https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist";

const res = await fetch(base + "/models/isnet_quint8", {
  headers: { Range: "bytes=0-1023" },
});
console.log("status:", res.status);
console.log("content-range:", res.headers.get("content-range"));
console.log("content-length:", res.headers.get("content-length"));
const buf = Buffer.from(await res.arrayBuffer());
console.log("bytes received:", buf.length);
console.log("first 16 bytes:", buf.subarray(0, 16).toString("hex"));
