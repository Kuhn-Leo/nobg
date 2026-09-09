// 下载 R2 自托管所需的分片文件包：node scripts/download-r2-files.mjs
// 产出 r2-upload/ 目录：resources.json + 若干 hash 命名的分片（结构与 CDN 一致）
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const base = "https://staticimgly.com/@imgly/background-removal-data/1.5.5/dist";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "r2-upload");

// 需要的资源：当前配置的模型 + 全部 wasm 引擎变体
const NEEDED = [
  "/models/isnet_quint8",
  "/onnxruntime-web/ort-wasm.wasm",
  "/onnxruntime-web/ort-wasm-threaded.wasm",
  "/onnxruntime-web/ort-wasm-simd.wasm",
  "/onnxruntime-web/ort-wasm-simd.jsep.wasm",
  "/onnxruntime-web/ort-wasm-simd-threaded.wasm",
  "/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm",
  "/onnxruntime-web/ort-training-wasm-simd.wasm",
];

await mkdir(outDir, { recursive: true });

// resources.json 本身已在（之前下载过）；没有则重新下载
const resPath = path.join(outDir, "resources.json");
if (!existsSync(resPath)) {
  const r = await fetch(base + "/resources.json");
  await writeFile(resPath, Buffer.from(await r.arrayBuffer()));
}
const map = JSON.parse(await readFile(resPath, "utf8"));

// 收集所需分片（去重）
const chunks = new Map(); // hash -> {name, size}
for (const key of NEEDED) {
  const entry = map[key];
  if (!entry) {
    console.error("MISSING in resources.json:", key);
    process.exit(1);
  }
  for (const c of entry.chunks) {
    const size = c.offsets[1] - c.offsets[0];
    chunks.set(c.hash, { size, key });
  }
}

console.log(`total unique chunks: ${chunks.size}`);
let done = 0;
const jobs = [...chunks.entries()];

async function worker(queue) {
  while (queue.length) {
    const [hash, info] = queue.shift();
    const target = path.join(outDir, hash);
    if (existsSync(target) && (await import("node:fs/promises")).stat(target).then((s) => s.size === info.size)) {
      done++;
      continue;
    }
    let ok = false;
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        const r = await fetch(`${base}/${hash}`);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length !== info.size) throw new Error(`size mismatch ${buf.length} != ${info.size}`);
        await writeFile(target, buf);
        ok = true;
      } catch (e) {
        if (attempt === 3) throw new Error(`chunk ${hash.slice(0, 8)} failed: ${e.message}`);
        await new Promise((r2) => setTimeout(r2, 1500 * attempt));
      }
    }
    done++;
    if (done % 5 === 0 || done === chunks.size) console.log(`progress: ${done}/${chunks.size}`);
  }
}

await Promise.all([worker(jobs), worker(jobs), worker(jobs), worker(jobs)]);
console.log(`ALL DONE: ${chunks.size} chunks + resources.json in r2-upload/`);
