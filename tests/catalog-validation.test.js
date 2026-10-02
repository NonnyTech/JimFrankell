import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProduct,
  validateFeedback,
} from "../server/catalog-validation.js";

const product = {
  name: "Solar Panel",
  slug: "solar-panel",
  category: "Solar Panels",
  price: null,
  images: ["/images/products/jf/panel-cutout.webp"],
  specifications: {},
  brand: "Jim-Frankell Ltd",
  shortDescription: "Solar power for your home.",
  description: "Contact our team for the available panel specifications.",
  warranty: "Confirm warranty before ordering.",
  inStock: true,
  featured: false,
  published: false,
};
test("product validation allows quote pricing, validates money and rejects unsafe image schemes", () => {
  assert.equal(validateProduct(product).price, null);
  for (const price of [-1, 0, Infinity, "100", 1.123])
    assert.throws(() => validateProduct({ ...product, price }));
  assert.equal(validateProduct({ ...product, price: 199.99 }).price, 199.99);
  for (const image of [
    "javascript:alert(1)",
    "data:image/svg+xml,test",
    "http://example.com/photo.jpg",
  ])
    assert.throws(() => validateProduct({ ...product, images: [image] }));
  assert.throws(() => validateProduct({ ...product, category: "Electronics" }));
  assert.throws(() => validateProduct({ ...product, published: "true" }));
});
test("feedback accepts only bounded content and does not accept moderation or verified-purchase fields", () => {
  const input = {
    productId: 204,
    name: " Customer ",
    email: "CUSTOMER@example.com",
    rating: 5,
    message: "The product works well.",
    consent: true,
    status: "approved",
    verifiedPurchase: true,
  };
  const result = validateFeedback(input);
  assert.equal(result.name, "Customer");
  assert.equal(result.email, "customer@example.com");
  assert.equal(result.status, undefined);
  assert.equal(result.verifiedPurchase, undefined);
  for (const change of [
    { rating: 6 },
    { rating: 1.5 },
    { productId: -1 },
    { consent: false },
    { message: "x".repeat(3001) },
    { email: "bad" },
  ])
    assert.throws(() => validateFeedback({ ...input, ...change }));
});
