// Run after npm run build. Exercises the actual Netlify renderer with mocked DB responses.
import assert from "node:assert/strict";
import { handler } from "../netlify/functions/storefront.mjs";
import { products } from "../src/data/products.js";
const originalFetch = globalThis.fetch;
const keys = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
try {
  keys.forEach((key) => {
    delete process.env[key];
  });
  const render = (route) =>
    handler({
      httpMethod: "GET",
      path: "/.netlify/functions/storefront",
      queryStringParameters: { route },
    });
  assert.equal((await render("/shop")).statusCode, 200);
  Object.assign(process.env, {
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "public",
    SUPABASE_SERVICE_ROLE_KEY: "secret",
  });
  const photo =
    "https://test.supabase.co/storage/v1/object/public/product-images/panel.webp";
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          id: 1000,
          slug: "new-live-panel",
          published: true,
          updated_at: new Date().toISOString(),
          data: { ...products[0], name: "New live panel", images: [photo] },
        },
      ]),
      { status: 200 },
    );
  const page = await render("/product/new-live-panel");
  assert.equal(page.statusCode, 200);
  assert.ok(page.body.includes("New live panel"));
  assert.ok(
    page.body.includes('href="https://jimfrankell.com/product/new-live-panel"'),
  );
  assert.ok(page.body.includes(`content="${photo}"`));
  assert.ok(page.body.includes("window.__JF_CATALOG__="));
  assert.ok(
    (await render("/sitemap.xml")).body.includes("/product/new-live-panel"),
  );
  assert.equal((await render("/product/missing")).statusCode, 404);
  // A hidden/deleted product must disappear from both its page and the sitemap.
  globalThis.fetch = async () => new Response("[]", { status: 200 });
  assert.equal((await render("/product/new-live-panel")).statusCode, 404);
  assert.ok(!(await render("/sitemap.xml")).body.includes("new-live-panel"));
  globalThis.fetch = async () => {
    throw Error("offline");
  };
  assert.equal((await render("/shop")).statusCode, 503);
  console.log(
    "Netlify render checks passed: fallback, live product, metadata, sitemap, hidden product and outage.",
  );
} finally {
  globalThis.fetch = originalFetch;
  for (const key of keys) {
    if (previous[key] === undefined) delete process.env[key];
    else process.env[key] = previous[key];
  }
}
