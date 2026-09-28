import test from "node:test";
import assert from "node:assert/strict";
import {
  pageSEO,
  siteOrigin,
  seoHead,
  publicRoutes,
} from "../src/utils/seo.js";
import { products } from "../src/data/products.js";

const origin = "https://store.test";
test("public pages have unique metadata and canonical URLs", () => {
  const pages = publicRoutes.map((path) => pageSEO(path, "", origin));
  assert.equal(
    new Set(pages.map((page) => page.title)).size,
    publicRoutes.length,
  );
  pages.forEach((page) => {
    assert.match(page.robots, /^index/);
    assert.ok(page.canonical.startsWith(origin));
    assert.ok(page.description.length > 60);
    assert.ok(page.graph.some((item) => item["@type"] === "Store"));
  });
});
test("previews, sample products, filters, cart and missing pages stay out of search", () => {
  assert.match(pageSEO("/", "", "").robots, /^noindex/);
  for (const path of [
    "/cart",
    "/missing",
    `/product/${"5kva-hybrid-inverter"}`,
  ]) {
    assert.match(pageSEO(path, "", origin).robots, /^noindex/);
  }
  const filtered = pageSEO("/shop", "?category=Inverters", origin);
  assert.match(filtered.robots, /^noindex/);
  assert.equal(filtered.canonical, origin + "/shop");
});
test("real camera structured data does not invent offers or reviews", () => {
  const product = products.find((p) => !p.isSample);
  const seo = pageSEO(`/product/${product.slug}`, "", origin);
  const schema = seo.graph.find((item) => item["@type"] === "Product");
  assert.equal(schema.name, product.name);
  assert.equal(schema.offers, undefined);
  assert.equal(schema.aggregateRating, undefined);
  const html = seoHead(seo);
  const json = html.match(/<script[^>]*>(.*?)<\/script>/)[1];
  assert.equal(JSON.parse(json)["@graph"].length, seo.graph.length);
});
test("domain validation and metadata escaping", () => {
  assert.equal(siteOrigin(""), "");
  assert.throws(() => siteOrigin("http://localhost:5173"));
  assert.throws(() => siteOrigin(origin + "/shop"));
  const html = seoHead({
    ...pageSEO("/", "", origin),
    title: '<unsafe>"',
    graph: [],
  });
  assert.ok(!html.includes("<unsafe>"));
  assert.ok(html.includes("&lt;unsafe&gt;"));
});
