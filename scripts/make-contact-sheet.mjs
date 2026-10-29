import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ids = [
  "1601050690597-df0568f70950",
  "1551504734-5ee1c4a1479b",
  "1568901346375-23c9450c58cd",
  "1565299624946-b28f40a0ae38",
  "1519676867240-f03562e64548",
  "1567620905732-2d1ec7ab7445",
  "1600271886742-f049cd451bba",
  "1528735602780-2552fd46c7af",
  "1504674900247-0877df9cc836",
  "1551024506-0bccd828d307",
  "1626700051175-6818013e1d4f",
  "1556910103-1c02745aae4d",
  "1613514785940-daed07799d9b",
  "1574071318508-1cdbab80d002",
  "1571091718767-18b5b1457add",
  "1553909489-cd47e0907980",
  "1544145945-f90425340c7e",
  "1544025162-d76694265947",
  "1573080496219-bb080dd4f877",
  "1488477181946-6428a0291777",
  "1414235077428-338989a2e8c0",
  "1517248135467-4c7edcad34c4",
  "1551024601-bec78aea704b",
  "1586190848861-99aa4a171e90",
  "1626074353765-517a681e40be",
  "1550547660-d9450f859349",
  "1541592106381-b31e9677c0e5",
  "1594007654729-407eedc4be65",
  "1593560708920-61dd98c46a4e",
  "1621996346565-e3dbc646d9a9",
  "1563379926898-05f4575a45d8",
  "1546069901-ba9599a7e63c",
  "1565958011703-44f9829ba187",
];

const out = path.resolve("scripts/thumbs");
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
    const res = await fetch(
      `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=480&h=360&q=70`,
    );
    if (!res.ok) throw new Error(String(res.status));
    const buffer = Buffer.from(await res.arrayBuffer());
    await sharp(buffer)
      .resize(thumbW, thumbH, { fit: "cover" })
      .jpeg({ quality: 82 })
      .toFile(file);
    const label = Buffer.from(
      `<svg width="${thumbW}" height="${labelH}"><rect width="${thumbW}" height="${labelH}" fill="#2c1c37"/><text x="8" y="19" font-family="Arial" font-size="14" fill="white">${i + 1} · ${id.slice(0, 13)}</text></svg>`,
    );
    const labelBuf = await sharp(label).png().toBuffer();
    const tile = await sharp({
      create: {
        width: thumbW,
        height: thumbH + labelH,
        channels: 3,
        background: "#2c1c37",
      },
    })
      .composite([
        { input: file, top: 0, left: 0 },
        { input: labelBuf, top: thumbH, left: 0 },
      ])
      .png()
      .toBuffer();
    tiles.push({ input: tile, top: Math.floor(i / cols) * (thumbH + labelH), left: (i % cols) * thumbW });
  } catch (e) {
    console.error("skip", i + 1, id, e.message);
  }
}

const rows = Math.ceil(ids.length / cols);
await sharp({
  create: {
    width: cols * thumbW,
    height: rows * (thumbH + labelH),
    channels: 3,
    background: "#2c1c37",
  },
})
  .composite(tiles)
  .jpeg({ quality: 86 })
  .toFile(path.join(out, "contact-sheet.jpg"));

console.log("done", tiles.length);
