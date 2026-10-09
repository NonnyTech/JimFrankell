import { test, expect } from "@playwright/test";
import { products } from "../../src/data/products.js";
const product = products.find((p) => p.category === "Inverters");
test("customer signup, cross-device basket, order history and sign-out work on mobile", async ({
  page,
  browser,
}) => {
  let cart = { items: [], revision: 0 };
  const requests = [];
  async function setup(p) {
    await p.route("https://customer.supabase.co/**", async (route) => {
      const url = route.request().url();
      if (url.includes("logout")) return route.fulfill({ status: 204 });
      if (url.includes("signup")) requests.push(route.request().postDataJSON());
      return route.fulfill({
        json: {
          access_token: "customer-token",
          refresh_token: "refresh",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: "11111111-1111-4111-8111-111111111111",
            email: "buyer@example.com",
            aud: "authenticated",
          },
        },
      });
    });
    await p.route("**/api/store?**", async (route) => {
      const resource = new URL(route.request().url()).searchParams.get(
        "resource",
      );
      let result;
      if (resource === "config")
        result = {
          configured: true,
          url: "https://customer.supabase.co",
          key: "public",
        };
      else if (resource === "products")
        result = { products: [product], live: true };
      else if (resource === "my-cart") {
        expect(route.request().headers().authorization).toBe(
          "Bearer customer-token",
        );
        if (route.request().method() === "PUT") {
          const body = route.request().postDataJSON();
          expect(body.revision).toBe(cart.revision);
          cart = { items: body.items, revision: cart.revision + 1 };
        }
        result = { cart };
      } else if (resource === "my-orders")
        result = {
          orders: [
            {
              reference: "JF-CUSTOMER-ORDER",
              status: "confirmed",
              created_at: "2026-10-08",
              total: 450000,
              items: [
                {
                  productId: 205,
                  kva: 12,
                  name: "Inverter (12 kVA)",
                  quantity: 1,
                  price: 450000,
                  slug: product.slug,
                  image: product.images[0],
                },
              ],
            },
          ],
        };
      else result = { reviews: [], enabled: true };
      await route.fulfill({ json: result });
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await page.goto("/account");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByLabel("Email", { exact: true }).fill("buyer@example.com");
  await page.getByLabel("Password", { exact: true }).fill("ExamplePassword123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page).toHaveURL("http://127.0.0.1:5173/");
  await expect(page.locator(".header-account-greeting")).toContainText("buyer@example.com");
  await page.locator(".header-account-greeting").click();
  expect(requests).toHaveLength(1);
  expect(requests[0].email).toBe("buyer@example.com");
  await expect(
    page.getByRole("heading", { name: "JF-CUSTOMER-ORDER" }),
  ).toBeVisible();
  await page.goto("/product/" + product.slug);
  await page.getByLabel("Choose inverter capacity (kVA)").selectOption("12");
  await page
    .getByRole("button", { name: "Add to basket", exact: true })
    .click();
  await expect.poll(() => cart.items.length).toBe(1);
  const second = await browser.newContext({
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 390, height: 844 },
  });
  try {
    const p = await second.newPage();
    await setup(p);
    await p.goto("/account");
    await p.getByLabel("Email", { exact: true }).fill("buyer@example.com");
    await p.getByLabel("Password", { exact: true }).fill("ExamplePassword123");
    await p.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(p).toHaveURL("http://127.0.0.1:5173/");
    await expect(p.locator(".header-account-greeting")).toContainText("buyer@example.com");
    await p.goto("/cart");
    await expect(p.locator(".cart-item")).toHaveCount(1);
    await expect(p.locator(".cart-item")).toContainText("12 kVA");
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await p.goto("/account");
    await p.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      p.getByRole("heading", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await expect(p.getByText("JF-CUSTOMER-ORDER")).toHaveCount(0);
    await p.goto("/cart");
    await expect(
      p.getByRole("heading", { name: "Your basket is empty." }),
    ).toBeVisible();
  } finally {
    await second.close();
  }
});
