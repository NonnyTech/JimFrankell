import { randomUUID } from "node:crypto";
import { products as seedProducts } from "../src/data/products.js";
import { validateProduct, validateFeedback } from "./catalog-validation.js";
import {
  configured,
  database,
  publishedProducts,
  unpackProduct,
  StoreError,
} from "./store-db.js";

const positiveId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0)
    throw new StoreError(400, "Invalid product.");
  return id;
};
const success = (body, status = 200) => ({ status, body });
export async function handleStore(req, env = process.env, fetcher = fetch) {
  try {
    const method = req.method || "GET";
    const resource = req.query?.resource || "products";
    if (method === "GET" && resource === "config")
      return success({
        configured: configured(env),
        ...(configured(env)
          ? { url: env.SUPABASE_URL, key: env.SUPABASE_PUBLISHABLE_KEY }
          : {}),
      });
    if (!configured(env)) {
      if (method === "GET" && resource === "products")
        return success({ products: seedProducts, live: false });
      if (method === "GET" && ["reviews", "home-reviews"].includes(resource))
        return success({ reviews: [], enabled: false });
      throw new StoreError(
        503,
        "The admin database has not been configured yet.",
      );
    }
    const db = database(env, fetcher);
    if (method === "GET" && resource === "home-reviews") {
      const reviews = [];
      for (let offset = 0; ; offset += 500) {
        const rows = await db.rest(
          `store_reviews?status=eq.approved&select=id,name,rating,message,created_at,store_products!inner(slug,product_name:data->>name)&store_products.published=eq.true&order=created_at.desc,id.desc&limit=500&offset=${offset}`,
        );
        reviews.push(...rows.map(({ store_products, ...review }) => ({ ...review, productName: store_products.product_name, productSlug: store_products.slug })));
        if (rows.length < 500) break;
      }
      return success({ reviews, enabled: true });
    }
    if (method === "GET" && resource === "products")
      return success({
        products: await publishedProducts(env, fetcher),
        live: true,
      });
    if (method === "GET" && resource === "reviews") {
      const id = positiveId(req.query.productId);
      const product = await db.rest(
        `store_products?id=eq.${id}&published=eq.true&select=id`,
      );
      if (!product.length) throw new StoreError(404, "Product not found.");
      const reviews = await db.rest(
        `store_reviews?product_id=eq.${id}&status=eq.approved&select=id,name,rating,message,created_at&order=created_at.desc&limit=100`,
      );
      return success({ reviews, enabled: true });
    }
    let body = {};
    if (method !== "GET") {
      if (!(req.contentType || "").includes("application/json"))
        throw new StoreError(415, "Send JSON data.");
      const raw =
        typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body || {});
      if (Buffer.byteLength(raw) > (resource === "upload" ? 4_300_000 : 40_000))
        throw new StoreError(413, "Request too large.");
      try {
        body = JSON.parse(raw);
      } catch {
        throw new StoreError(400, "Invalid request data.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new StoreError(400, "Invalid request data.");
    }
    if (resource === "feedback" && method === "POST") {
      if (body.website)
        return success(
          { message: "Thank you for sharing your feedback." },
          202,
        );
      let review;
      try {
        review = validateFeedback(body);
      } catch (error) {
        throw new StoreError(400, error.message);
      }
      await db.limit(`feedback-ip:${req.ip || "unknown"}`, 5, 3600);
      await db.limit(`feedback-email:${review.email}`, 3, 86400);
      const rows = await db.rest(
        `store_products?id=eq.${review.productId}&published=eq.true&select=id`,
      );
      if (!rows.length)
        throw new StoreError(
          404,
          "This product is no longer available for feedback.",
        );
      await db.rest("store_reviews", {
        method: "POST",
        body: JSON.stringify({
          product_id: review.productId,
          name: review.name,
          email: review.email,
          rating: review.rating,
          message: review.message,
          status: "pending",
        }),
      });
      return success(
        {
          message:
            "Thank you for sharing your feedback.",
        },
        201,
      );
    }
    // Every admin read and write authenticates with Supabase and checks a private allowlist.
    const user = await db.admin(req.token);
    if (resource === "admin-products" && method === "GET") {
      const offset = Math.max(0, Number(req.query.offset) || 0);
      return success({
        products: (
          await db.rest(
            `store_products?select=*&order=id.desc&limit=100&offset=${offset}`,
          )
        ).map(unpackProduct),
      });
    }
    if (resource === "admin-reviews" && method === "GET") {
      const status = ["pending", "approved", "rejected"].includes(
        req.query.status,
      )
        ? req.query.status
        : "pending";
      const offset = Math.max(0, Number(req.query.offset) || 0);
      return success({
        reviews: await db.rest(
          `store_reviews?status=eq.${status}&select=*,store_products(slug,data)&order=created_at.desc&limit=100&offset=${offset}`,
        ),
      });
    }
    if (resource === "admin-products" && ["POST", "PATCH"].includes(method)) {
      let product;
      try {
        product = validateProduct(body);
      } catch (error) {
        throw new StoreError(400, error.message);
      }
      let existing;
      if (method === "PATCH") {
        existing = (
          await db.rest(`store_products?id=eq.${positiveId(body.id)}&select=*`)
        )[0];
        if (!existing) throw new StoreError(404, "Product not found.");
        if (existing.slug !== product.slug)
          throw new StoreError(
            400,
            "The URL of an existing product cannot be changed.",
          );
        if (body.updatedAt !== existing.updated_at)
          throw new StoreError(
            409,
            "This product was changed elsewhere. Reload it before saving.",
          );
      }
      const { slug, published, ...data } = product;
      const rows = await db.rest(
        `store_products${existing ? `?id=eq.${existing.id}&updated_at=eq.${encodeURIComponent(existing.updated_at)}` : ""}`,
        {
          method,
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            slug,
            published,
            data: { ...existing?.data, ...data },
            updated_at: new Date().toISOString(),
          }),
        },
      );
      if (!rows.length)
        throw new StoreError(
          409,
          "This product was changed elsewhere. Reload it before saving.",
        );
      await db.audit(
        user.id,
        existing ? "product.updated" : "product.created",
        rows[0].id,
      );
      return success({ product: unpackProduct(rows[0]) }, existing ? 200 : 201);
    }
    if (resource === "moderate" && method === "PATCH") {
      if (
        !/^[a-f0-9-]{36}$/i.test(body.id || "") ||
        !["approved", "rejected", "pending"].includes(body.status)
      )
        throw new StoreError(400, "Invalid review decision.");
      const rows = await db.rest(`store_reviews?id=eq.${body.id}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          status: body.status,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
        }),
      });
      if (!rows.length) throw new StoreError(404, "Review not found.");
      await db.audit(user.id, `review.${body.status}`, body.id);
      return success({ success: true });
    }
    if (resource === "upload" && method === "POST") {
      await db.limit(`upload:${user.id}`, 60, 3600);
      if (
        typeof body.image !== "string" ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(body.image)
      )
        throw new StoreError(400, "Choose a valid photo.");
      const bytes = Buffer.from(body.image, "base64");
      if (bytes.length > 3 * 1024 * 1024)
        throw new StoreError(413, "Photos must be smaller than 3 MB.");
      const { default: sharp } = await import("sharp");
      let image;
      try {
        const source = sharp(bytes, {
          limitInputPixels: 24_000_000,
          animated: false,
        });
        const info = await source.metadata();
        if (!["jpeg", "png", "webp"].includes(info.format))
          throw Error("Unsupported image");
        image = await source
          .rotate()
          .resize({
            width: 1600,
            height: 1600,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
      } catch {
        throw new StoreError(
          400,
          "Use a valid JPEG, PNG or WebP photo up to 24 megapixels.",
        );
      }
      const name = `${randomUUID()}.webp`;
      await db.request(`/storage/v1/object/product-images/${name}`, {
        method: "POST",
        headers: { "Content-Type": "image/webp" },
        body: image,
      });
      return success(
        {
          url: `${env.SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images/${name}`,
        },
        201,
      );
    }
    throw new StoreError(405, "This operation is not supported.");
  } catch (error) {
    return {
      status: error instanceof StoreError ? error.status : 503,
      body: {
        error:
          error instanceof StoreError
            ? error.message
            : "The service is unavailable. Please try again.",
      },
    };
  }
}
