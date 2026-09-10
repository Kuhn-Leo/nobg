// R2 wasm/mjs 配套修复：全部换成 npm ort 1.21.0 的配套文件（消除版本不匹配）
// 用法：node scripts/fix-r2-ort.mjs
import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r2 = path.join(root, "r2-upload");
const ortDist = path.join(root, "node_modules", "onnxruntime-web", "dist");
await mkdir(path.join(r2, "onnxruntime-web"), { recursive: true });

const resPath = path.join(r2, "resources.json");
const map = JSON.parse(await readFile(resPath, "utf8"));

const targets = [
  { file: "ort-wasm-simd-threaded.wasm", key: "/onnxruntime-web/ort-wasm-simd-threaded.wasm", mime: "application/wasm" },
  { file: "ort-wasm-simd-threaded.jsep.wasm", key: "/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm", mime: "application/wasm" },
  { file: "ort-wasm-simd-threaded.mjs", key: "/onnxruntime-web/ort-wasm-simd-threaded.mjs", mime: "text/javascript" },
  { file: "ort-wasm-simd-threaded.jsep.mjs", key: "/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs", mime: "text/javascript" },
];

for (const t of targets) {
  await copyFile(path.join(ortDist, t.file), path.join(r2, "onnxruntime-web", t.file));
  const size = (await import("node:fs/promises")).stat(path.join(r2, "onnxruntime-web", t.file)).then((s) => s.size);
  map[t.key] = {
    mime: t.mime,
    size: await size,
    chunks: [{ hash: t.key, name: "onnxruntime-web/" + t.file, offsets: [0, await size] }],
  };
  console.log("updated:", t.key, await size, "bytes");
}

await writeFile(resPath, JSON.stringify(map, null, 2));
console.log("resources.json updated, total keys:", Object.keys(map).length);
