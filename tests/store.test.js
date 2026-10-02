import test from "node:test";
import assert from "node:assert/strict";
import { handleStore } from "../server/store.js";
import { pageSEO } from "../src/utils/seo.js";
import { products } from "../src/data/products.js";
const env = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "server-secret",
  SUPABASE_PUBLISHABLE_KEY: "public-key",
};
const user = "11111111-1111-4111-8111-111111111111";
const reviewId = "22222222-2222-4222-8222-222222222222";
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function mockDB({
  admin = true,
  auth = true,
  allowed = true,
  published = true,
} = {}) {
  const calls = [];
  const row = {
    id: 1000,
    slug: "new-panel",
    published,
    data: { ...products[0], name: "New Panel" },
    updated_at: "2026-10-02T00:00:00.000Z",
  };
  const fetcher = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const body =
      options.body && typeof options.body === "string"
        ? JSON.parse(options.body)
        : options.body;
    calls.push({ url, options, body });
    if (path === "/auth/v1/user")
      return auth ? json({ id: user }) : json({}, 401);
    if (path.endsWith("store_admins"))
      return json(admin ? [{ user_id: user }] : []);
    if (path.endsWith("store_take_limit")) return json(allowed);
    if (path.endsWith("store_products")) {
      if (options.method) return json([{ ...row, ...body }]);
      return json(published || !url.includes("published=eq.true") ? [row] : []);
    }
    if (path.endsWith("store_reviews"))
      return json(
        options.method
          ? [{ id: reviewId, ...body }]
          : [
              {
                id: reviewId,
                name: "Customer",
                rating: 5,
                message: "Very helpful team.",
                created_at: "2026-10-02",
              },
            ],
      );
    if (path.endsWith("store_audit")) return json({});
    throw Error(`Unexpected request: ${url}`);
  };
  return { calls, fetcher, row };
}
const request = (resource, body, method = "POST", token = "valid-token") => ({
  method,
  query: { resource },
  contentType: "application/json",
  body,
  token,
  ip: "127.0.0.1",
});
test("unconfigured store preserves catalog but denies admin; partial configuration fails closed", async () => {
  assert.equal(
    (await handleStore({ method: "GET", query: { resource: "products" } }, {}))
      .body.products.length,
    13,
  );
  assert.equal(
    (await handleStore(request("admin-products", {}), {})).status,
    503,
  );
  assert.equal(
    (
      await handleStore(
        { method: "GET", query: { resource: "products" } },
        { SUPABASE_URL: env.SUPABASE_URL },
      )
    ).status,
    503,
  );
  const result = await handleStore(
    { method: "GET", query: { resource: "config" } },
    env,
  );
  assert.equal(result.body.key, "public-key");
  assert.ok(!JSON.stringify(result).includes("server-secret"));
});
test("anonymous, forged-token and non-admin accounts cannot read or write administration data", async () => {
  for (const resource of [
    "admin-products",
    "admin-reviews",
    "moderate",
    "upload",
  ]) {
    for (const [config, token, status] of [
      [{}, "", 401],
      [{ auth: false }, "forged", 401],
      [{ admin: false }, "valid", 403],
    ]) {
      const db = mockDB(config);
      const result = await handleStore(
        request(resource, {}, "POST", token),
        env,
        db.fetcher,
      );
      assert.equal(result.status, status);
      assert.ok(!db.calls.some((c) => c.options.method));
    }
  }
});
test("feedback always becomes pending, excludes forged privileges and hashes rate-limit identifiers", async () => {
  const db = mockDB();
  const body = {
    productId: 1000,
    name: "Buyer",
    email: "buyer@example.com",
    rating: 4,
    message: "The camera works very well.",
    consent: true,
    status: "approved",
    verifiedPurchase: true,
  };
  const result = await handleStore(request("feedback", body), env, db.fetcher);
  assert.equal(result.status, 201);
  const saved = db.calls.find((c) => c.url.includes("store_reviews"));
  assert.equal(saved.body.status, "pending");
  assert.equal(saved.body.verifiedPurchase, undefined);
  const limit = db.calls.find((c) => c.url.includes("store_take_limit"));
  assert.match(limit.body.p_key, /^[a-f0-9]{64}$/);
  assert.ok(!JSON.stringify(limit.body).includes("127.0.0.1"));
  const blocked = mockDB({ allowed: false });
  assert.equal(
    (await handleStore(request("feedback", body), env, blocked.fetcher)).status,
    429,
  );
  assert.ok(!blocked.calls.some((c) => c.url.includes("store_reviews")));
  assert.equal(
    (
      await handleStore(
        request("feedback", body),
        env,
        mockDB({ published: false }).fetcher,
      )
    ).status,
    404,
  );
});
test("public feedback query selects only approved public fields and hides unpublished products", async () => {
  const db = mockDB();
  const req = {
    method: "GET",
    query: { resource: "reviews", productId: "1000" },
  };
  assert.equal((await handleStore(req, env, db.fetcher)).status, 200);
  const call = db.calls.find((c) => c.url.includes("store_reviews"));
  assert.ok(call.url.includes("status=eq.approved"));
  assert.ok(call.url.includes("select=id,name,rating,message,created_at"));
  assert.ok(!call.url.includes("email"));
  assert.equal(
    (await handleStore(req, env, mockDB({ published: false }).fetcher)).status,
    404,
  );
});
test("product saves validate values, protect URLs and detect conflicting edits", async () => {
  const db = mockDB();
  const product = {
    ...products[0],
    id: 1000,
    slug: "new-panel",
    published: true,
    updatedAt: db.row.updated_at,
  };
  assert.equal(
    (
      await handleStore(
        request("admin-products", product, "PATCH"),
        env,
        db.fetcher,
      )
    ).status,
    200,
  );
  assert.ok(db.calls.some((c) => c.url.includes("updated_at=eq.")));
  assert.ok(db.calls.some((c) => c.url.includes("store_audit")));
  assert.equal(
    (
      await handleStore(
        request("admin-products", { ...product, price: -1 }),
        env,
        db.fetcher,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handleStore(
        request("admin-products", { ...product, updatedAt: "stale" }, "PATCH"),
        env,
        db.fetcher,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await handleStore(
        request("admin-products", { ...product, slug: "different" }, "PATCH"),
        env,
        db.fetcher,
      )
    ).status,
    400,
  );
});
test("moderation permits decisions only, not customer-content replacement", async () => {
  const db = mockDB();
  assert.equal(
    (
      await handleStore(
        request(
          "moderate",
          { id: reviewId, status: "approved", message: "fabricated" },
          "PATCH",
        ),
        env,
        db.fetcher,
      )
    ).status,
    200,
  );
  const patch = db.calls.find((c) => c.url.includes("store_reviews"));
  assert.equal(patch.body.message, undefined);
  assert.equal(patch.body.moderated_by, user);
});
test("uploads reject invalid bytes and oversized requests before storage writes", async () => {
  const db = mockDB();
  assert.equal(
    (
      await handleStore(
        request("upload", {
          image: Buffer.from("not an image").toString("base64"),
        }),
        env,
        db.fetcher,
      )
    ).status,
    400,
  );
  assert.ok(!db.calls.some((c) => c.url.includes("/storage/")));
  assert.equal(
    (
      await handleStore(
        request("feedback", { message: "x".repeat(40001) }),
        env,
        db.fetcher,
      )
    ).status,
    413,
  );
});
test("new database products have canonical metadata without static catalog entries; admin stays noindex", () => {
  const product = {
    ...products[0],
    id: 1000,
    slug: "new-panel",
    images: [
      "https://project.supabase.co/storage/v1/object/public/product-images/photo.webp",
    ],
  };
  const seo = pageSEO("/product/new-panel", "", "https://jimfrankell.com", [
    product,
  ]);
  assert.equal(seo.image, product.images[0]);
  assert.equal(
    seo.graph.find((row) => row["@type"] === "Product").image[0],
    product.images[0],
  );
  assert.equal(seo.canonical, "https://jimfrankell.com/product/new-panel");
  assert.match(seo.robots, /^index/);
  assert.match(pageSEO("/admin").robots, /^noindex/);
});
