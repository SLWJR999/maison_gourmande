import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const images = [
  ["hero-fataya.jpg", "unsplash", "1601050690597-df0568f70950", 1600],
  ["hero-tacos.jpg", "unsplash", "1613514785940-daed07799d9b", 1200],
  ["hero-crepe.jpg", "unsplash", "1519676867240-f03562e64548", 1200],
  ["hero-burger.jpg", "unsplash", "1568901346375-23c9450c58cd", 1200],
  ["spread.jpg", "unsplash", "1504674900247-0877df9cc836", 1600],
  ["chef.jpg", "unsplash", "1556910103-1c02745aae4d", 1400],
  ["fataya.jpg", "unsplash", "1601050690597-df0568f70950", 1400],
  ["nems.jpg", "unsplash", "1601050690597-df0568f70950", 1400],
  ["tacos.jpg", "unsplash", "1613514785940-daed07799d9b", 1400],
  ["tacos-2.jpg", "unsplash", "1551504734-5ee1c4a1479b", 1400],
  ["tortilla.jpg", "pexels", "461198", 1400],
  ["pizza.jpg", "unsplash", "1574071318508-1cdbab80d002", 1400],
  ["pizza-2.jpg", "unsplash", "1565299624946-b28f40a0ae38", 1400],
  ["pizza-3.jpg", "pexels", "4109111", 1400],
  ["pizza-4.jpg", "unsplash", "1593560708920-61dd98c46a4e", 1400],
  ["burger.jpg", "unsplash", "1568901346375-23c9450c58cd", 1400],
  ["burger-2.jpg", "unsplash", "1550547660-d9450f859349", 1400],
  ["sandwich.jpg", "unsplash", "1528735602780-2552fd46c7af", 1400],
  ["sandwich-2.jpg", "unsplash", "1553909489-cd47e0907980", 1400],
  ["crepe-nutella.jpg", "unsplash", "1551024506-0bccd828d307", 1400],
  ["crepe.jpg", "unsplash", "1519676867240-f03562e64548", 1400],
  ["pancakes.jpg", "unsplash", "1567620905732-2d1ec7ab7445", 1400],
  ["juice.jpg", "unsplash", "1600271886742-f049cd451bba", 1400],
  ["juice-2.jpg", "pexels", "4021983", 1400],
  ["juice-3.jpg", "unsplash", "1544145945-f90425340c7e", 1400],
  ["event.jpg", "pexels", "5638732", 1600],
  ["event-2.jpg", "unsplash", "1414235077428-338989a2e8c0", 1400],
  ["event-3.jpg", "unsplash", "1517248135467-4c7edcad34c4", 1400],
  ["pastry.jpg", "pexels", "1126359", 1400],
  ["donuts.jpg", "unsplash", "1551024601-bec78aea704b", 1400],
  ["plate.jpg", "unsplash", "1504674900247-0877df9cc836", 1600],
  ["food-table.jpg", "pexels", "5638732", 1600],
];

const out = path.resolve("public/images");
await fs.mkdir(out, { recursive: true });

for (const [name, source, id, width] of images) {
  const url =
    source === "unsplash"
      ? `https://images.unsplash.com/photo-${id}?auto=format&fit=max&w=${width}&q=80`
      : `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
  const destination = path.join(out, name);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const buffer = Buffer.from(await res.arrayBuffer());
    const metadata = await sharp(buffer).metadata();
    await sharp(buffer)
      .rotate()
      .resize({ width: Math.min(width, metadata.width || width), withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(destination);
    console.log("ok", name, metadata.width, metadata.height);
  } catch (error) {
    console.error("fail", name, error.message);
  }
}

const videoUrl =
  "https://videos.pexels.com/video-files/8626672/8626672-hd_1920_1080_25fps.mp4";
const videoOut = path.resolve("public/videos");
await fs.mkdir(videoOut, { recursive: true });
try {
  const res = await fetch(videoUrl);
  if (!res.ok) throw new Error(String(res.status));
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(path.join(videoOut, "maison-gourmande.mp4"), buffer);
  console.log("ok video", Math.round(buffer.length / 1024 / 1024), "Mo");
} catch (error) {
  console.error("fail video", error.message);
}
