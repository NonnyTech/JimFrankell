import { readFileSync } from "node:fs";
import { render } from "../../.prerender/entry-server.js";
import {
  pageSEO,
  seoHead,
  publicRoutes,
  escapeHTML,
  siteOrigin,
} from "../../src/utils/seo.js";
import { products as seedProducts } from "../../src/data/products.js";
import { configured, publishedProducts } from "../../server/store-db.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET" && event.httpMethod !== "HEAD")
    return {
      statusCode: 405,
      headers: { Allow: "GET, HEAD" },
      body: "Method not allowed",
    };
  const path =
    (event.queryStringParameters?.route || event.path).replace(/\/+$/, "") ||
    "/";
  const headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  try {
    const live = configured(process.env);
    const products = live ? await publishedProducts(process.env) : seedProducts;
    if (path === "/sitemap.xml") {
      const paths = [
        ...publicRoutes,
        ...products.map((p) => `/product/${p.slug}`),
      ];
      return {
        statusCode: 200,
        headers: { ...headers, "Content-Type": "application/xml" },
        body:
          event.httpMethod === "HEAD"
            ? ""
            : `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${escapeHTML(siteOrigin() + p)}</loc></url>`).join("")}</urlset>`,
      };
    }
    const found =
      publicRoutes.includes(path) ||
      products.some((p) => path === `/product/${p.slug}`);
    const template = readFileSync("dist/store-shell.html", "utf8");
    const bootstrap = JSON.stringify({ products, live }).replace(
      /</g,
      "\\u003c",
    );
    const html = template
      .replace(
        "</head>",
        `${seoHead(pageSEO(path, event.rawQuery ? `?${event.rawQuery}` : "", siteOrigin(), products))}</head>`,
      )
      .replace(
        '<div id="root"></div>',
        () =>
          `<div id="root">${render(found ? path : "/404", products, live)}</div><script>window.__JF_CATALOG__=${bootstrap}</script>`,
      );
    return {
      statusCode: found ? 200 : 404,
      headers,
      body: event.httpMethod === "HEAD" ? "" : html,
    };
  } catch {
    return {
      statusCode: 503,
      headers: { ...headers, "Retry-After": "60" },
      body: '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Store temporarily unavailable</title><h1>Our store is temporarily unavailable.</h1><p>Please try again shortly.</p></html>',
    };
  }
};
