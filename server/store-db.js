import { createHmac } from "node:crypto";
import { defaultInverterOptions } from "../src/utils/inverter-options.js";
export class StoreError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function configured(env) {
  const keys = [
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.SUPABASE_PUBLISHABLE_KEY,
  ];
  if (keys.some(Boolean) && !keys.every(Boolean))
    throw new StoreError(
      503,
      "Database configuration is incomplete. Please contact the site administrator.",
    );
  return keys.every(Boolean);
}
export function database(env, fetcher = fetch) {
  const origin = env.SUPABASE_URL?.replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  async function request(path, options = {}) {
    const response = await fetcher(`${origin}${path}`, {
      ...options,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      if (response.status === 409)
        throw new StoreError(
          409,
          "That product URL already exists. Choose another one.",
        );
      throw new StoreError(
        502,
        "The database is unavailable. Please try again.",
      );
    }
    // PostgREST writes can succeed with an empty 201 body (return=minimal).
    const body = await response.text();
    return body.trim() ? JSON.parse(body) : null;
  }
  const rest = (path, options) => request(`/rest/v1/${path}`, options);
  const digest = (value) =>
    createHmac("sha256", key).update(value).digest("hex");
  return {
    request,
    rest,
    async admin(token) {
      if (!token) throw new StoreError(401, "Please sign in to continue.");
      const response = await fetcher(`${origin}/auth/v1/user`, {
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new StoreError(
          401,
          "Your session has expired. Please sign in again.",
        );
      const user = await response.json();
      if (!/^[a-f0-9-]{36}$/i.test(user.id || ""))
        throw new StoreError(401, "Invalid session.");
      const admins = await rest(
        `store_admins?user_id=eq.${user.id}&select=user_id`,
      );
      if (!admins.length)
        throw new StoreError(403, "Access restricted. This account does not have admin access. You must sign in with an authorised administrator account.");
      return user;
    },
    async limit(identity, maximum, seconds) {
      const allowed = await rest("rpc/store_take_limit", {
        method: "POST",
        body: JSON.stringify({
          p_key: digest(identity),
          p_limit: maximum,
          p_seconds: seconds,
        }),
      });
      if (!allowed)
        throw new StoreError(429, "Too many requests. Please try again later.");
    },
    async audit(actor, action, resource) {
      await rest("store_audit", {
        method: "POST",
        body: JSON.stringify({ actor, action, resource: String(resource) }),
      });
    },
  };
}
export function unpackProduct(row) {
  return {
    ...row.data,
    // Supply the owner's initial prices for the existing listing until its first admin save.
    // An explicitly saved empty array opts out; never replace edited options.
    ...(row.slug === "jf-hybrid-solar-inverter" && row.data.category === "Inverters" && row.data.inverterOptions == null
      ? { inverterOptions: defaultInverterOptions, price: 180000 } : {}),
    id: row.id,
    slug: row.slug,
    published: row.published,
    updatedAt: row.updated_at,
  };
}
export async function publishedProducts(env, fetcher = fetch) {
  const db = database(env, fetcher);
  const all = [];
  // Pagination avoids silently dropping products at the PostgREST row limit.
  for (let offset = 0; ; offset += 500) {
    const rows = await db.rest(
      `store_products?published=eq.true&select=*&order=id.asc&limit=500&offset=${offset}`,
    );
    all.push(...rows.map(unpackProduct));
    if (rows.length < 500) return all;
  }
}
