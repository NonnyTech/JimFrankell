import test from "node:test";
import assert from "node:assert/strict";
import { products, categories, sampleProducts } from "../src/data/products.js";
import { businessConfig as business } from "../src/config/businessConfig.js";
import {
  cartMessage,
  productMessage,
  whatsappUrl,
} from "../src/utils/whatsapp.js";
import { formatCurrency } from "../src/utils/currency.js";
import {
  handleContact,
  validateContact,
  resetRateLimits,
} from "../server/contact.js";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { securityProducts } from "../src/data/securityProducts.js";
test("all eight supplied photos have quote-only listings and safe mixed-cart totals", () => {
  assert.equal(securityProducts.length, 8);
  assert.equal(new Set(securityProducts.map((p) => p.images[0])).size, 8);
  for (const p of securityProducts) {
    assert.equal(p.price, null);
    assert.equal(p.stockLabel, "Confirm availability");
    assert.ok(p.featured);
  }
  const message = cartMessage([
    { product: securityProducts[0], quantity: 2 },
    { product: sampleProducts[0], quantity: 1 },
  ]);
  assert.ok(message.includes("Subtotal: Price on request"));
  assert.ok(message.includes("ORDER TOTAL: Quotation required"));
  assert.ok(!message.includes("₦0"));
});
test("catalog has unique, complete products with existing local assets", () => {
  assert.ok(products.length === 13);
  assert.equal(new Set(products.map((p) => p.slug)).size, products.length);
  for (const p of products) {
    assert.ok(categories.some((c) => c.name === p.category));
    assert.ok(p.price === null || p.price > 0);
    assert.ok(Object.keys(p.specifications).length);
    for (const image of p.images) assert.ok(existsSync("public" + image));
  }
});
test("cart message includes quantities, unit prices, subtotals and exact total", () => {
  const message = cartMessage([
    { product: sampleProducts[0], quantity: 2 },
    { product: sampleProducts[1], quantity: 1 },
  ]);
  assert.match(message, /Quantity: 2/);
  assert.ok(message.includes(`Subtotal: ${formatCurrency(850000)}`));
  assert.ok(message.includes(`ORDER TOTAL: ${formatCurrency(2300000)}`));
  assert.ok(
    message.includes(
      "Please confirm availability, warranty, delivery cost and next steps.",
    ),
  );
});
test("WhatsApp encodes full product enquiry and refuses missing recipient", () => {
  const previous = business.whatsappNumber;
  try {
    business.whatsappNumber = "";
    assert.equal(whatsappUrl(), null);
    business.whatsappNumber = "2348000000000";
    const message = productMessage(products[1]);
    const url = new URL(whatsappUrl(message));
    assert.equal(url.searchParams.get("text"), message);
    assert.equal(url.pathname, "/2348000000000");
    assert.ok(message.includes(products[1].name));
  } finally {
    business.whatsappNumber = previous;
  }
});
const valid = {
  name: "Test Customer",
  email: "customer@example.com",
  phone: "+234 800 000 0000",
  subject: "Solar enquiry",
  message: "I would like help choosing a solar system.",
};
test("contact validation rejects malformed, oversized and injected input", () => {
  assert.ok(validateContact(valid));
  for (const input of [
    null,
    {},
    { ...valid, email: "not-an-email" },
    { ...valid, name: "  " },
    { ...valid, subject: "Hello\r\nBcc: another@example.com" },
    { ...valid, message: "x".repeat(5001) },
    { ...valid, phone: "script" },
  ])
    assert.equal(validateContact(input), null);
});
test("contact endpoint validates method, format, size and missing settings", async () => {
  resetRateLimits();
  assert.equal((await handleContact({ method: "GET" })).status, 405);
  assert.equal(
    (await handleContact({ method: "POST", contentType: "text/plain" })).status,
    415,
  );
  assert.equal(
    (await handleContact({ method: "POST", body: "{" })).status,
    400,
  );
  assert.equal(
    (await handleContact({ method: "POST", body: "x".repeat(12001) })).status,
    413,
  );
  assert.equal(
    (await handleContact({ method: "POST", body: valid }, {})).status,
    503,
  );
});
test("Brevo request stays server-side and carries reply-to and plain-text content", async () => {
  resetRateLimits();
  let sent;
  const env = {
    BREVO_API_KEY: "unit-test-secret",
    CONTACT_RECEIVER_EMAIL: "owner@example.com",
    CONTACT_SENDER_EMAIL: "verified@example.com",
    CONTACT_SENDER_NAME: "Website",
  };
  const response = await handleContact(
    { method: "POST", body: valid },
    env,
    async (url, options) => {
      sent = { url, ...options };
      return { ok: true };
    },
  );
  assert.equal(response.status, 200);
  assert.equal(sent.url, "https://api.brevo.com/v3/smtp/email");
  assert.equal(sent.headers["api-key"], "unit-test-secret");
  const payload = JSON.parse(sent.body);
  assert.equal(payload.replyTo.email, valid.email);
  assert.equal(payload.subject, "New Website Enquiry - Solar enquiry");
  assert.ok(payload.textContent.includes(valid.message));
  assert.ok(payload.textContent.includes("Date/Time:"));
  assert.equal(payload.to[0].email, env.CONTACT_RECEIVER_EMAIL);
  for (const file of readdirSync("src", { recursive: true }).filter((f) =>
    /\.(js|jsx)$/.test(f),
  ))
    assert.ok(!readFileSync("src/" + file, "utf8").includes("BREVO_API_KEY"));
});
test("contact handles Brevo failures, network failure, bots and rate limits", async () => {
  resetRateLimits();
  const env = {
    BREVO_API_KEY: "test",
    CONTACT_RECEIVER_EMAIL: "owner@example.com",
    CONTACT_SENDER_EMAIL: "verified@example.com",
  };
  assert.equal(
    (
      await handleContact({ method: "POST", body: valid }, env, async () => ({
        ok: false,
      }))
    ).status,
    502,
  );
  assert.equal(
    (
      await handleContact({ method: "POST", body: valid }, env, async () => {
        throw Error("offline");
      })
    ).status,
    502,
  );
  assert.equal(
    (
      await handleContact(
        { method: "POST", body: { ...valid, website: "spam" } },
        env,
        () => {
          throw Error("must not send");
        },
      )
    ).status,
    200,
  );
  for (let i = 0; i < 5; i++)
    await handleContact({ method: "POST", body: valid, ip: "rate-test" }, {});
  assert.equal(
    (await handleContact({ method: "POST", body: valid, ip: "rate-test" }, {}))
      .status,
    429,
  );
});
