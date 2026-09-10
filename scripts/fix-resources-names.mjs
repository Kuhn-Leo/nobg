// 给 resources.json 的每个分片补 name 字段（= hash，与 R2 中的文件名一致）
// 用法：node scripts/fix-resources-names.mjs
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "r2-upload", "resources.json");
const map = JSON.parse(await readFile(p, "utf8"));

let patched = 0;
for (const key of Object.keys(map)) {
  for (const chunk of map[key].chunks) {
    if (!chunk.name) {
      chunk.name = chunk.hash;
      patched++;
    }
  }
}

await writeFile(p, JSON.stringify(map, null, 2));
console.log(`patched ${patched} chunks with name=hash`);
// 抽样验证
const sample = map["/models/isnet_quint8"].chunks[0];
console.log("sample:", JSON.stringify(sample).slice(0, 120));
