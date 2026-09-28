// Native SVG illustrations remain editable. Add the owner's shield to the
// illustrated housing; write separate versions without changing originals.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const mark = (x, y, scale = 1, color = "#a12632") =>
  `<g transform="translate(${x} ${y}) scale(${scale})" fill="${color}" aria-label="Jim-Frankell Ltd"><path d="M0 3 9 0l9 3v14q-3 5-9 8-6-3-9-8Z"/><path d="M2 5 9 2l7 3v11q-2 4-7 7-5-3-7-7Z" fill="none" stroke="white" stroke-width=".7"/><text x="5" y="13" fill="white" font-family="Georgia,serif" font-size="10">J</text><text x="9" y="18" fill="white" font-family="Georgia,serif" font-size="10">F</text><text x="23" y="16" font-family="Arial,sans-serif" font-size="10" font-weight="600">Jim-Frankell Ltd</text></g>`;
const positions = {
  inverter: [145, 167, 1],
  lithium: [143, 232, 1],
  battery: [145, 200, 1],
  light: [149, 69, 0.45, "#ffffff"],
  accessories: [247, 182, 0.4],
};
mkdirSync("public/images/products/jf", { recursive: true });
for (const name of [
  "panel",
  "inverter",
  "lithium",
  "battery",
  "kit",
  "light",
  "accessories",
]) {
  for (const detail of [false, true]) {
    const filename = `${name}${detail ? "-detail" : ""}.svg`;
    let svg = readFileSync(`public/images/products/${filename}`, "utf8");
    let branding;
    if (name === "panel")
      branding = `<g transform="translate(106 35) rotate(8 90 125)">${mark(64, 244, 0.35, "#243933")}</g>`;
    else if (name === "kit")
      branding = `<g transform="translate(123 80) scale(.68)">${mark(...positions.inverter)}</g><g transform="translate(47 128) scale(.5)">${mark(...positions.lithium)}</g>`;
    else branding = mark(...positions[name]);
    svg = svg.replace("</g></svg>", `${branding}</g></svg>`);
    writeFileSync(`public/images/products/jf/${filename}`, svg);
  }
}
console.log("Created 14 JF-branded SVG illustrations.");
