// 从品牌原图 public/brand/n-logo.png 生成全套 PNG 图标：node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "public/brand/n-logo.png");
const outDir = path.join(root, "public/icons");
await mkdir(outDir, { recursive: true });

// 裁掉四周白边，得到紧贴 logo 磁贴的方形图
const tile = await sharp(src).trim({ threshold: 30 }).toBuffer();

function roundedMask(size, radius) {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`
  );
}

async function makeIcon(size, name, { round = true } = {}) {
  let buf = await sharp(tile).resize(size, size).png().toBuffer();
  if (round) {
    // 圆角磁贴：圆角外变透明（用于透明背景场景）
    buf = await sharp(buf)
      .composite([{ input: roundedMask(size, Math.round(size * 0.2)), blend: "dest-in" }])
      .png()
      .toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: buf, left: 0, top: 0 }])
      .png()
      .toFile(path.join(outDir, name));
  } else {
    // 全出血方形（maskable / apple-touch：系统自己套圆角）
    await sharp(buf).png().toFile(path.join(outDir, name));
  }
  console.log("generated", name, `${size}x${size}`);
}

await makeIcon(192, "icon-192.png", { round: true });
await makeIcon(512, "icon-512.png", { round: true });
await makeIcon(512, "icon-maskable-512.png", { round: false });
await makeIcon(180, "apple-touch-icon.png", { round: false });
