import { loadEnv } from "vite";
import { products } from "../src/data/products.js";
import { configured, database } from "../server/store-db.js";
const env = { ...loadEnv("development", process.cwd(), ""), ...process.env };
if (!configured(env))
  throw Error(
    "Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SERVICE_ROLE_KEY in .env first.",
  );
const db = database(env);
// Ignore existing IDs. Re-running must never overwrite an admin's edits.
await db.rest("store_products?on_conflict=id", {
  method: "POST",
  headers: { Prefer: "resolution=ignore-duplicates" },
  body: JSON.stringify(
    products.map(({ id, slug, ...data }) => ({
      id,
      slug,
      data,
      published: true,
    })),
  ),
});
console.log(
  `Imported up to ${products.length} real catalog products. Existing products were preserved.`,
);
