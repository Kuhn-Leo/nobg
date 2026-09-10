// 把 ort 包里的 mjs 胶水文件加入 R2 包，并在 resources.json 中注册
// 用法：node scripts/add-mjs-to-r2.mjs
import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const r2 = path.join(root, "r2-upload");
const ortDist = path.join(root, "node_modules", "onnxruntime-web", "dist");

await mkdir(path.join(r2, "onnxruntime-web"), { recursive: true });

const targets = [
  { file: "ort-wasm-simd-threaded.mjs", key: "/onnxruntime-web/ort-wasm-simd-threaded.mjs", mime: "text/javascript" },
  { file: "ort-wasm-simd-threaded.jsep.mjs", key: "/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs", mime: "text/javascript" },
];

const resPath = path.join(r2, "resources.json");
const map = JSON.parse(await readFile(resPath, "utf8"));

for (const t of targets) {
  await copyFile(path.join(ortDist, t.file), path.join(r2, "onnxruntime-web", t.file));
  const size = (await import("node:fs/promises")).stat(path.join(r2, "onnxruntime-web", t.file)).then((s) => s.size);
  // name 必须带子目录路径（相对于 publicPath 根），库按 {publicPath}/{name} 拉取
  map[t.key] = {
    mime: t.mime,
    size: await size,
    chunks: [{ hash: t.key, name: "onnxruntime-web/" + t.file, offsets: [0, await size] }],
  };
  console.log("added:", t.key, await size, "bytes");
}

await writeFile(resPath, JSON.stringify(map, null, 2));
console.log("resources.json updated, total keys:", Object.keys(map).length);
