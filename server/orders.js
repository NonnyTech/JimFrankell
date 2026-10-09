import { createHash, randomUUID } from "node:crypto";
import { StoreError, unpackProduct } from "./store-db.js";
import {
  inverterOptions,
  selectInverter,
} from "../src/utils/inverter-options.js";

export const orderStatuses = [
  "new",
  "confirmed",
  "dispatched",
  "completed",
  "cancelled",
];
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function text(value, label, min, max) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    throw new StoreError(
      400,
      `${label} must contain ${min}–${max} characters.`,
    );
  return value.trim();
}
export function validateOrder(body) {
  if (!uuid.test(body.requestKey || ""))
    throw new StoreError(
      400,
      "Invalid order request. Please refresh and try again.",
    );
  if (body.website || body.consent !== true)
    throw new StoreError(400, "Please agree to be contacted about your order.");
  const customer = body.customer || {};
  const name = text(customer.name, "Name", 2, 100);
  const phone = text(customer.phone, "Phone number", 7, 25).replace(
    /[\s()+-]/g,
    "",
  );
  if (!/^\d{7,15}$/.test(phone))
    throw new StoreError(400, "Enter a valid phone number.");
  if (!["delivery", "pickup"].includes(customer.fulfilment))
    throw new StoreError(400, "Choose delivery or collection.");
  const address =
    customer.fulfilment === "delivery"
      ? text(customer.address, "Delivery address", 10, 500)
      : "";
  const installation = customer.installation;
  if (
    ![
      "Not sure yet",
      "Yes, please include installation",
      "No, products only",
    ].includes(installation)
  )
    throw new StoreError(400, "Choose an installation option.");
  const notes = text(customer.notes ?? "", "Notes", 0, 600);
  if (
    !Array.isArray(body.items) ||
    !body.items.length ||
    body.items.length > 50
  )
    throw new StoreError(400, "An order must contain 1–50 items.");
  const seen = new Set();
  const items = body.items.map((item) => {
    if (
      !item ||
      !Number.isSafeInteger(item.id) ||
      item.id <= 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    )
      throw new StoreError(400, "Invalid product or quantity.");
    if (
      item.kva != null &&
      (typeof item.kva !== "number" ||
        !Number.isFinite(item.kva) ||
        item.kva <= 0)
    )
      throw new StoreError(400, "Invalid inverter capacity.");
    if (
      item.expectedPrice !== null &&
      (typeof item.expectedPrice !== "number" ||
        !Number.isFinite(item.expectedPrice) ||
        item.expectedPrice <= 0)
    )
      throw new StoreError(
        400,
        "Invalid displayed price. Refresh your basket.",
      );
    const key = `${item.id}:${item.kva ?? ""}`;
    if (seen.has(key))
      throw new StoreError(
        400,
        "Duplicate product options. Refresh your basket.",
      );
    seen.add(key);
    return {
      id: item.id,
      kva: item.kva ?? null,
      quantity: item.quantity,
      expectedPrice: item.expectedPrice,
    };
  });
  return {
    customer: {
      name,
      phone,
      fulfilment: customer.fulfilment,
      address,
      installation,
      notes,
    },
    items,
  };
}
const receipt = (order) => ({
  reference: order.reference,
  customer: order.customer,
  items: order.items,
  total: order.total,
  status: order.status,
});

export async function createOrder(db, body, ip, customerId = null) {
  const input = validateOrder(body);
  await db.limit(`order-ip:${ip || "unknown"}`, 10, 3600);
  await db.limit(`order-phone:${input.customer.phone}`, 8, 86400);
  const hash = createHash("sha256")
    .update(JSON.stringify(customerId ? { ...input, customerId } : input))
    .digest("hex");
  const path = `store_orders?request_key=eq.${body.requestKey}&select=*`;
  const previous = (await db.rest(path))[0];
  if (previous) {
    if (
      previous.request_hash !== hash ||
      (previous.customer_id ?? null) !== customerId
    )
      throw new StoreError(
        409,
        "This request was already used for a different order. Please start again.",
      );
    return receipt(previous);
  }
  const ids = [...new Set(input.items.map((item) => item.id))];
  const products = (
    await db.rest(
      `store_products?id=in.(${ids.join(",")})&published=eq.true&select=*`,
    )
  ).map(unpackProduct);
  const items = input.items.map((item) => {
    const product = products.find((p) => p.id === item.id);
    if (!product || !product.inStock)
      throw new StoreError(
        409,
        "An item is no longer available. Refresh your basket before ordering.",
      );
    const options = inverterOptions(product);
    if (
      (options.length && !options.some((o) => o.kva === item.kva)) ||
      (!options.length && item.kva != null)
    )
      throw new StoreError(
        409,
        "An inverter option has changed. Refresh your basket.",
      );
    const selected = selectInverter(product, item.kva);
    if (selected.price !== item.expectedPrice)
      throw new StoreError(
        409,
        "A product price has changed. Refresh your basket to review the current price before ordering.",
      );
    return {
      productId: selected.id,
      slug: selected.slug,
      name: selected.name,
      image: selected.images[0],
      kva: item.kva,
      quantity: item.quantity,
      price: selected.price,
      subtotal:
        selected.price == null
          ? null
          : (Math.round(selected.price * 100) * item.quantity) / 100,
    };
  });
  const total = items.some((item) => item.price == null)
    ? null
    : items.reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0) /
      100;
  await db.rest("store_orders?on_conflict=request_key", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      reference: `JF-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
      request_key: body.requestKey,
      request_hash: hash,
      ...(customerId ? { customer_id: customerId } : {}),
      customer: input.customer,
      items,
      total,
      status: "new",
    }),
  });
  const saved = (await db.rest(path))[0];
  if (!saved || saved.request_hash !== hash)
    throw new StoreError(409, "Unable to confirm this order. Please retry.");
  return receipt(saved);
}

export async function adminOrders(db, req, body, user) {
  if (req.method === "GET" || !req.method) {
    const status = req.query?.status || "all";
    if (status !== "all" && !orderStatuses.includes(status))
      throw new StoreError(400, "Invalid order status.");
    const offset = Math.max(0, Math.floor(Number(req.query?.offset) || 0));
    return {
      orders: await db.rest(
        `store_orders?select=id,reference,customer,items,total,status,created_at,updated_at&order=created_at.desc,id.desc&limit=100&offset=${offset}${status === "all" ? "" : `&status=eq.${status}`}`,
      ),
    };
  }
  if (req.method !== "PATCH")
    throw new StoreError(405, "This operation is not supported.");
  if (
    !uuid.test(body.id || "") ||
    !orderStatuses.includes(body.status) ||
    typeof body.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(body.updatedAt))
  )
    throw new StoreError(400, "Invalid order update.");
  const rows = await db.rest(
    `store_orders?id=eq.${body.id}&updated_at=eq.${encodeURIComponent(body.updatedAt)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status: body.status,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }),
    },
  );
  if (!rows.length)
    throw new StoreError(
      409,
      "This order changed elsewhere. Refresh before updating it.",
    );
  await db.audit(user.id, `order.${body.status}`, body.id);
  return { success: true };
}
