import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ids = [4625441, 433149, 2098085, 955137, 1907225, 1449771, 5946981, 4021983, 2135759, 2144202, 5638732, 4198024, 1279330, 376464, 461198, 1126359, 6602820, 5938358, 6608449, 4109111];
const out = path.resolve("scripts/thumbs-pexels");
await fs.mkdir(out, { recursive: true });
const thumbW = 240;
const thumbH = 180;
const cols = 5;
const labelH = 28;
const tiles = [];
for (let i = 0; i < ids.length; i++) {
  const id = ids[i];
  const file = path.join(out, `${i + 1}.jpg`);
  try {
    const res = await fetch(`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=480&h=360&fit=crop`);
    if (!res.ok) throw new Error(String(res.status));
    const buffer = Buffer.from(await res.arrayBuffer());
    await sharp(buffer).resize(thumbW, thumbH, { fit: "cover" }).jpeg({ quality: 82 }).toFile(file);
    const label = Buffer.from(`<svg width="${thumbW}" height="${labelH}"><rect width="${thumbW}" height="${labelH}" fill="#2c1c37"/><text x="8" y="19" font-family="Arial" font-size="14" fill="white">${i + 1} · pexels ${id}</text></svg>`);
    const labelBuf = await sharp(label).png().toBuffer();
    const tile = await sharp({ create: { width: thumbW, height: thumbH + labelH, channels: 3, background: "#2c1c37" } })
      .composite([{ input: file, top: 0, left: 0 }, { input: labelBuf, top: thumbH, left: 0 }])
      .png()
      .toBuffer();
    tiles.push({ input: tile, top: Math.floor(i / cols) * (thumbH + labelH), left: (i % cols) * thumbW });
  } catch (e) {
    console.error("skip", i + 1, id, e.message);
  }
}
const rows = Math.ceil(ids.length / cols);
await sharp({ create: { width: cols * thumbW, height: rows * (thumbH + labelH), channels: 3, background: "#2c1c37" } })
  .composite(tiles)
  .jpeg({ quality: 86 })
  .toFile(path.join(out, "contact-sheet.jpg"));
console.log("done", tiles.length);
