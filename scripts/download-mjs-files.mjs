// 补下载 onnxruntime-web 的 .mjs 胶水文件（resources.json 清单里没有，但运行时需要）
// 用法：node scripts/download-mjs-files.mjs
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = "https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "r2-upload", "onnxruntime-web");
await mkdir(outDir, { recursive: true });

const files = [
  "ort-wasm.mjs",
  "ort-wasm-threaded.mjs",
  "ort-wasm-simd.mjs",
  "ort-wasm-simd.jsep.mjs",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.jsep.mjs",
  "ort-training-wasm-simd.mjs",
];

for (const f of files) {
  const target = path.join(outDir, f);
  try {
    const r = await fetch(`${base}/onnxruntime-web/${f}`);
    if (!r.ok) {
      console.log("SKIP (not found):", f, r.status);
      continue;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    await writeFile(target, buf);
    console.log("downloaded:", f, buf.length, "bytes");
  } catch (e) {
    console.log("ERR:", f, e.message.slice(0, 60));
  }
}
