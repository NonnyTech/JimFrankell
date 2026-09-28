import sharp from "sharp";
import { stat } from "node:fs/promises";

const images = [
  ...["family", "team", "garden", "living"].map((name) => `hero/solar-${name}`),
  "about-camera-installation",
  "page-banner-scenes",
  "support-banner-scenes",
];
let before = 0,
  after = 0;
for (const name of images) {
  const source = `public/images/${name}.png`;
  const target = `public/images/${name}.webp`;
  await sharp(source)
    .resize({ width: 1774, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(target);
  before += (await stat(source)).size;
  after += (await stat(target)).size;
}
console.log(
  `Banner images: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB (${Math.round((1 - after / before) * 100)}% smaller). Originals preserved.`,
);
