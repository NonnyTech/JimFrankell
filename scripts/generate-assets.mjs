import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("public/images/products", { recursive: true });
const panel =
  '<g transform="translate(106 35) rotate(8 90 125)"><rect width="185" height="250" rx="4" fill="#a4b3b9"/><rect x="6" y="6" width="173" height="238" fill="#17334c"/>' +
  Array.from(
    { length: 7 },
    (_, i) =>
      `<path d="M8 ${35 + i * 30}h169" stroke="#809ead" stroke-width="2"/>`,
  ).join("") +
  Array.from(
    { length: 5 },
    (_, i) =>
      `<path d="M${35 + i * 29} 8v234" stroke="#809ead" stroke-width="2"/>`,
  ).join("") +
  "</g>";
const inverter =
  '<rect x="115" y="40" width="167" height="245" rx="16" fill="url(#white)" stroke="#cbd4d2"/><path d="M115 68q0-28 20-28h125q22 0 22 28v60H115" fill="#243933"/><rect x="169" y="67" width="62" height="35" rx="4" fill="#96bca0"/><path d="M179 85h12l6-9 6 17 6-8h11" fill="none" stroke="#2d6545" stroke-width="2"/><circle cx="199" cy="150" r="5" fill="#39a568"/><path d="M142 230h113m-113 8h113m-113 8h113" stroke="#bac4c0" stroke-width="3"/><text x="199" y="200" text-anchor="middle" fill="#62716c" font-size="10">HYBRID POWER</text>';
const lithium =
  '<rect x="109" y="52" width="182" height="222" rx="14" fill="url(#white)" stroke="#c3ceca"/><rect x="119" y="62" width="162" height="38" rx="5" fill="#233a32"/><rect x="169" y="68" width="58" height="24" rx="3" fill="#9ecca8"/><path d="M186 151h26v39h-26z" fill="none" stroke="#40805a" stroke-width="3"/><path d="m202 151-10 23h10l-7 16" fill="none" stroke="#40805a" stroke-width="3"/><text x="200" y="218" text-anchor="middle" fill="#5a6c63" font-size="11">LITHIUM ENERGY</text>';
const parts = {
  panel,
  inverter,
  lithium,
  battery:
    '<rect x="98" y="101" width="205" height="155" rx="9" fill="#293b38"/><rect x="94" y="89" width="213" height="30" rx="5" fill="#405b4d"/><rect x="121" y="75" width="22" height="16" fill="#d56151"/><rect x="257" y="75" width="22" height="16" fill="#8c969a"/><rect x="115" y="140" width="171" height="87" rx="4" fill="#edf0e9"/><text x="201" y="184" text-anchor="middle" fill="#2c6744" font-size="25" font-weight="bold">200Ah</text>',
  fridge:
    '<rect x="131" y="26" width="138" height="274" rx="9" fill="url(#white)" stroke="#b0bebb"/><path d="M131 125h138" stroke="#9aaba4" stroke-width="3"/><path d="M149 80v27m0 42v45" stroke="#495d54" stroke-width="5"/>',
  tv: '<rect x="50" y="62" width="300" height="182" rx="6" fill="#20322c"/><rect x="58" y="70" width="284" height="164" fill="#799d8b"/><path d="m58 220 80-100 65 66 65-97 74 83v62H58" fill="#33594b"/><path d="m58 220 90-57 83 60 70-61 41 45v27H58" fill="#142f29"/><circle cx="268" cy="105" r="20" fill="#e6d8a9"/><path d="m119 244-15 29m179-29 15 29" stroke="#293b33" stroke-width="8"/>',
  fan:
    '<path d="M200 167v109m-55 8h110" stroke="#bbc7c0" stroke-width="13"/><circle cx="200" cy="115" r="77" fill="#e2e8e2" stroke="#849b90" stroke-width="5"/>' +
    [0, 120, 240]
      .map(
        (a) =>
          `<ellipse cx="200" cy="90" rx="18" ry="39" fill="#799c88" transform="rotate(${a} 200 115)"/>`,
      )
      .join("") +
    '<circle cx="200" cy="115" r="14" fill="#394f43"/>',
  light:
    '<rect x="102" y="67" width="196" height="153" rx="10" fill="#293d34"/><rect x="114" y="79" width="172" height="129" fill="#d5ddc9"/>' +
    Array.from(
      { length: 20 },
      (_, i) =>
        `<circle cx="${138 + (i % 5) * 30}" cy="${103 + Math.floor(i / 5) * 30}" r="8" fill="#f8f2ca"/>`,
    ).join("") +
    '<path d="M127 225v30h147v-30" fill="none" stroke="#394c41" stroke-width="9"/>',
  accessories:
    '<ellipse cx="171" cy="162" rx="71" ry="62" fill="none" stroke="#243c30" stroke-width="21"/><ellipse cx="171" cy="162" rx="47" ry="39" fill="none" stroke="#394e40" stroke-width="10"/><path d="m248 130 36 60m-21-70 36 60" stroke="#d3ab67" stroke-width="14"/><path d="m233 214 63 16" stroke="#667f6d" stroke-width="17"/>',
  fallback:
    '<rect x="125" y="95" width="150" height="145" rx="10" fill="#d2dfd3"/><path d="m125 95 75-35 75 35-75 35zm75 35v110" fill="none" stroke="#71977d" stroke-width="4"/>',
};
parts.kit = `<g transform="translate(-35 10) scale(.72)">${panel}</g><g transform="translate(123 80) scale(.68)">${inverter}</g><g transform="translate(47 128) scale(.5)">${lithium}</g>`;
for (const [name, body] of Object.entries(parts))
  for (const detail of [false, true])
    writeFileSync(
      `public/images/products/${name}${detail ? "-detail" : ""}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 330"><defs><linearGradient id="white"><stop stop-color="#fff"/><stop offset=".65" stop-color="#eef1ed"/><stop offset="1" stop-color="#c9d2cd"/></linearGradient></defs><ellipse cx="200" cy="296" rx="104" ry="9" fill="#7f9388" opacity=".12"/><g ${detail ? 'transform="translate(-40 -35) scale(1.2)"' : ""}>${body}</g></svg>`,
    );
let hero =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 680"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#c7d6c1"/><stop offset="1" stop-color="#ecedde"/></linearGradient><linearGradient id="wall" x2="1" y2="1"><stop stop-color="#f8f5e8"/><stop offset="1" stop-color="#cbcbbf"/></linearGradient></defs><rect width="800" height="680" fill="url(#sky)"/><circle cx="634" cy="113" r="67" fill="#f4edc8"/><path d="M0 360q170-160 360-20t440-50v390H0" fill="#9aaa87"/><path d="M0 428q220-115 430-19t370-40v311H0" fill="#788d68"/><path d="m-40 551 440-134 445 127v136H0" fill="#b7ba9e"/><path d="m60 469 355-81 316 114-362 151z" fill="#d6d5c0"/><path d="m120 312 288-79 264 83v207l-264 87-288-103z" fill="url(#wall)"/><path d="m408 233 264 83v207l-264 87z" fill="#babfb3"/><path d="m92 301 317-117 293 99-30 44-264-85-288 84z" fill="#263e38"/><path d="m120 294 288-97 238 81-262 92z" fill="#365d69"/>';
for (let i = 0; i < 7; i++)
  hero += `<path d="m${140 + i * 36} ${287 - i * 12} 232 79" stroke="#a1b9b2" stroke-width="2"/>`;
for (let i = 0; i < 5; i++)
  hero += `<path d="m${126 + i * 54} ${296 + i * 18} 282-96" stroke="#a1b9b2" stroke-width="2"/>`;
hero +=
  '<path d="m148 351 113-30v159l-113-39zm135-36 96-26v181l-96 27z" fill="#24433c"/><path d="M204 336v125m126-159v180" stroke="#8b9d8e" stroke-width="5"/><path d="m433 337 172 55v105l-172 57z" fill="#24433c"/><path d="M484 353v184m58-165v145" stroke="#829689" stroke-width="5"/><path d="m104 475 302 103 282-85v21l-282 96-302-110z" fill="#e6e3d1"/><rect x="618" y="415" width="47" height="78" rx="5" fill="#f4f5e9"/><rect x="625" y="424" width="33" height="18" rx="3" fill="#29493d"/><path d="M45 553V297" stroke="#52694b" stroke-width="12"/><path d="M723 560V367" stroke="#526447" stroke-width="12"/><ellipse cx="725" cy="368" rx="51" ry="90" fill="#4f6e48"/><ellipse cx="57" cy="298" rx="53" ry="99" fill="#587a50"/><path d="m257 680 135-83 115 20-77 63" fill="#ebe7d2"/><g fill="#517046"><ellipse cx="143" cy="547" rx="36" ry="21"/><ellipse cx="173" cy="553" rx="25" ry="19"/><ellipse cx="684" cy="566" rx="47" ry="23"/></g></svg>';
writeFileSync("public/images/solar-home.svg", hero);
