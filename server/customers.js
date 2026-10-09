import { StoreError } from "./store-db.js";
export async function customerResource(db, req, body) {
  const user = await db.customer(req.token);
  if (req.query.resource === "my-orders" && req.method === "GET") {
    const offset = Math.min(
      100000,
      Math.max(0, Math.floor(Number(req.query.offset) || 0)),
    );
    return {
      orders: await db.rest(
        `store_orders?customer_id=eq.${user.id}&select=reference,items,total,status,created_at&order=created_at.desc,id.desc&limit=20&offset=${offset}`,
      ),
    };
  }
  if (req.query.resource !== "my-cart")
    throw new StoreError(405, "This operation is not supported.");
  if (req.method === "GET") {
    await db.rest("store_carts?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify({ user_id: user.id }),
    });
    const [cart] = await db.rest(
      `store_carts?user_id=eq.${user.id}&select=items,revision`,
    );
    return { cart };
  }
  if (req.method !== "PUT")
    throw new StoreError(405, "This operation is not supported.");
  if (
    !Number.isSafeInteger(body.revision) ||
    body.revision < 0 ||
    !Array.isArray(body.items) ||
    body.items.length > 50
  )
    throw new StoreError(400, "Invalid basket.");
  const keys = new Set();
  const items = body.items.map((item) => {
    if (
      !item ||
      !Number.isSafeInteger(item.id) ||
      item.id < 1 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99 ||
      (item.kva != null &&
        (typeof item.kva !== "number" ||
          !Number.isFinite(item.kva) ||
          item.kva <= 0))
    )
      throw new StoreError(400, "Invalid basket item.");
    const key = `${item.id}:${item.kva ?? ""}`;
    if (keys.has(key)) throw new StoreError(400, "Duplicate basket item.");
    keys.add(key);
    return {
      id: item.id,
      quantity: item.quantity,
      ...(item.kva != null ? { kva: item.kva } : {}),
    };
  });
  const rows = await db.rest(
    `store_carts?user_id=eq.${user.id}&revision=eq.${body.revision}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        items,
        revision: body.revision + 1,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!rows.length)
    throw new StoreError(
      409,
      "Your basket changed on another device. Reload your saved basket before making more changes.",
    );
  return { cart: { items: rows[0].items, revision: rows[0].revision } };
}
