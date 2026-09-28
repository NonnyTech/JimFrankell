import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { render } from "../.prerender/entry-server.js";
import {
  pageSEO,
  seoHead,
  renderRoutes,
  publicRoutes,
  siteOrigin,
  escapeHTML,
} from "../src/utils/seo.js";
import { products } from "../src/data/products.js";
const template = readFileSync("dist/index.html", "utf8")
  .replace(/<title>[\s\S]*?<\/title>/, "")
  .replace(/<meta\s+name="description"[^>]*>/, "");
for (const path of renderRoutes) {
  const file = path === "/" ? "dist/index.html" : `dist${path}.html`;
  mkdirSync(dirname(file), { recursive: true });
  const html = template
    .replace("</head>", seoHead(pageSEO(path)) + "</head>")
    .replace(
      '<div id="root"></div>',
      () => `<div id="root">${render(path)}</div>`,
    );
  writeFileSync(file, html);
}
const origin = siteOrigin();
const indexable = origin
  ? [
      ...publicRoutes,
      ...products.filter((p) => !p.isSample).map((p) => `/product/${p.slug}`),
    ]
  : [];
writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${indexable.map((path) => `<url><loc>${escapeHTML(origin + path)}</loc></url>`).join("")}</urlset>`,
);
writeFileSync(
  "dist/robots.txt",
  `User-agent: *\nAllow: /\nDisallow: /api/\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ""}`,
);
console.log(
  `Prerendered ${renderRoutes.length} pages. Sitemap: ${indexable.length} URLs.`,
);
if (!origin)
  console.warn(
    "SEO launch setting required: set businessConfig.websiteUrl to the public HTTPS domain. Pages are noindex until configured.",
  );
