import test from "node:test";
import assert from "node:assert/strict";
import { handleStore } from "../server/store.js";
import { customerResource } from "../server/customers.js";
import { createOrder } from "../server/orders.js";
import { products } from "../src/data/products.js";
const id = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const env = {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "public",
  SUPABASE_SERVICE_ROLE_KEY: "secret",
};
test("customer resources deny anonymous/invalid sessions and scope queries to verified user, ignoring supplied owner", async () => {
  for (const resource of ["my-orders", "my-cart"]) {
    assert.equal(
      (await handleStore({ method: "GET", query: { resource } }, env)).status,
      401,
    );
    assert.equal(
      (
        await handleStore(
          { method: "GET", query: { resource }, token: "bad" },
          env,
          async () => new Response("{}", { status: 401 }),
        )
      ).status,
      401,
    );
  }
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    return new Response(
      JSON.stringify(url.includes("/auth/v1/user") ? { id } : []),
    );
  };
  const result = await handleStore(
    {
      method: "GET",
      token: "valid",
      query: { resource: "my-orders", customer_id: other },
    },
    env,
    fetcher,
  );
  assert.equal(result.status, 200);
  assert.ok(calls.some((url) => url.includes("customer_id=eq." + id)));
  assert.ok(calls.every((url) => !url.includes(other)));
});
test("saved carts strip forged prices and owners, and prevent stale overwrites", async () => {
  let update;
  const db = {
    customer: async () => ({ id }),
    rest: async (path, options) => {
      update = { path, data: JSON.parse(options.body) };
      return [{ items: [], revision: 2 }];
    },
  };
  const req = { method: "PUT", query: { resource: "my-cart" } };
  await customerResource(db, req, {
    revision: 1,
    user_id: other,
    items: [{ id: 205, kva: 12, quantity: 2, price: 1 }],
  });
  assert.ok(update.path.includes("user_id=eq." + id));
  assert.ok(update.path.includes("revision=eq.1"));
  assert.deepEqual(update.data.items, [{ id: 205, kva: 12, quantity: 2 }]);
  await assert.rejects(
    customerResource({ ...db, rest: async () => [] }, req, {
      revision: 0,
      items: [],
    }),
    (e) => e.status === 409,
  );
  await assert.rejects(
    customerResource(db, req, {
      revision: 1,
      items: [{ id: 1, quantity: -1 }],
    }),
    (e) => e.status === 400,
  );
});
test("new order belongs only to authenticated identity and cannot be retrieved by another account through a retry", async () => {
  const product = products.find((p) => p.category === "Inverters");
  let saved;
  const db = {
    limit: async () => {},
    rest: async (path, options = {}) => {
      if (path.startsWith("store_products"))
        return [{ id: product.id, slug: product.slug, data: product }];
      if (options.method === "POST") {
        saved = JSON.parse(options.body);
        return null;
      }
      return saved ? [saved] : [];
    },
  };
  const body = {
    requestKey: id,
    consent: true,
    customer_id: other,
    customer: {
      name: "Test Customer",
      phone: "08012345678",
      fulfilment: "pickup",
      installation: "No, products only",
      notes: "",
    },
    items: [{ id: product.id, kva: 12, quantity: 1, expectedPrice: 450000 }],
  };
  await createOrder(db, body, "ip", id);
  assert.equal(saved.customer_id, id);
  await assert.rejects(
    createOrder(db, body, "ip", other),
    (e) => e.status === 409,
  );
  await assert.rejects(createOrder(db, body, "ip"), (e) => e.status === 409);
});
