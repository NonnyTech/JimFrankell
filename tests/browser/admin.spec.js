import { test, expect } from "@playwright/test";
import { products } from "../../src/data/products.js";
const product = {
  ...products[0],
  id: 1000,
  slug: "live-camera",
  name: "Live Camera",
  published: true,
  updatedAt: "2026-10-02T00:00:00.000Z",
};
async function mockStore(page, { denied = false } = {}) {
  const saved = [],
    feedback = [],
    decisions = [];
  await page.route("https://project.supabase.co/**", async (route) => {
    const data = {
      access_token: "test-session",
      refresh_token: "test-refresh",
      expires_in: 3600,
      token_type: "bearer",
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        email: "admin@example.com",
        aud: "authenticated",
      },
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(data),
    });
  });
  await page.route("**/api/store?**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const resource = url.searchParams.get("resource");
    let result,
      status = 200;
    if (resource === "config")
      result = {
        configured: true,
        url: "https://project.supabase.co",
        key: "test-public",
      };
    else if (resource === "products")
      result = { products: [product], live: true };
    else if (["reviews", "home-reviews"].includes(resource)) result = { reviews: [], enabled: true };
    else if (resource === "feedback") {
      feedback.push(request.postDataJSON());
      result = {
        message:
          "Thank you for sharing your feedback.",
      };
    } else if (denied) {
      status = 403;
      result = { error: "This account does not have admin access." };
    } else if (resource === "admin-products") {
      if (request.method() === "GET") result = { products: [product] };
      else {
        saved.push(request.postDataJSON());
        result = { product: { ...request.postDataJSON(), id: 1001 } };
      }
    } else if (resource === "admin-reviews")
      result = {
        reviews: decisions.length
          ? []
          : [
              {
                id: "22222222-2222-4222-8222-222222222222",
                name: "Buyer",
                email: "private@example.com",
                rating: 5,
                message: "Very useful product.",
                status: "pending",
                created_at: "2026-10-02",
                store_products: { data: { name: "Live Camera" } },
              },
            ],
      };
    else if (resource === "moderate") {
      decisions.push(request.postDataJSON());
      result = { success: true };
    } else if (resource === "upload")
      result = { url: "/images/products/jf/white-triple-camera.webp" };
    else throw Error(`Unexpected resource ${resource}`);
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(result),
    });
  });
  return { saved, feedback, decisions };
}
async function login(page) {
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("not-a-real-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
test("admin edits price and publication, creates a product with photo, and approves feedback", async ({
  page,
}) => {
  const calls = await mockStore(page);
  await login(page);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Price (NGN)").fill("95000");
  await page.getByLabel("Publish in the store").uncheck();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.locator(".admin-notice[role=status]")).toContainText(
    "Draft saved",
  );
  expect(calls.saved[0].price).toBe(95000);
  expect(calls.saved[0].published).toBe(false);
  await page
    .getByRole("button", { name: "+ Add product", exact: true })
    .click();
  await page
    .getByLabel("Product name", { exact: true })
    .fill("New Solar Panel");
  await page.getByLabel("Product URL slug").fill("new-solar-panel");
  await page
    .getByRole("combobox", { name: "Category", exact: true })
    .selectOption("Solar Panels");
  await page
    .getByLabel("Short description")
    .fill("A new solar panel for your home.");
  await page
    .getByLabel("Full description")
    .fill("Ask our team for the available solar panel specifications.");
  await page
    .getByLabel("Product photos")
    .setInputFiles("public/images/products/jf/white-triple-camera.webp");
  await expect(page.getByAltText("Product photo 1")).toBeVisible();
  await page.getByLabel("Publish in the store").check();
  await page.getByRole("button", { name: "Save product" }).click();
  await expect(page.locator(".admin-notice[role=status]")).toContainText(
    "Product saved and published",
  );
  expect(calls.saved[1].price).toBe(null);
  expect(calls.saved[1].images).toHaveLength(1);
  await page.getByRole("button", { name: "Customer feedback" }).click();
  await expect(
    page.getByText("private@example.com", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-dashboard.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    page.getByText("No pending reviews on this page."),
  ).toBeVisible();
  expect(calls.decisions[0].status).toBe("approved");
});
test("non-admin is denied and cannot see product management controls", async ({
  page,
}) => {
  await mockStore(page, { denied: true });
  await login(page);
  await expect(page.getByRole("alert")).toContainText(
    "does not have admin access",
  );
  await expect(page.getByRole("button", { name: "+ Add product" })).toHaveCount(
    0,
  );
});
test("dynamic product survives basket reload and feedback awaits approval on mobile", async ({
  page,
}) => {
  const calls = await mockStore(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/product/live-camera");
  await expect(
    page.getByRole("heading", { name: "Live Camera", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add to quote", exact: true }).click();
  await page.goto("/cart");
  await page.reload();
  await expect(page.locator(".cart-item")).toContainText("Live Camera");
  await page.goto("/product/live-camera");
  await page.getByLabel("Display name", { exact: true }).fill("Buyer");
  await page.getByLabel("Email address").fill("buyer@example.com");
  await page
    .getByRole("combobox", { name: "Rating", exact: true })
    .selectOption("4");
  await page
    .getByLabel("Your feedback", { exact: true })
    .fill("The camera works well for my home.");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit feedback" }).click();
  await expect(
    page.getByText(
      "Thank you for sharing your feedback.",
    ),
  ).toBeVisible();
  await expect(page.locator(".review")).toHaveCount(0);
  expect(calls.feedback[0].productId).toBe(1000);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/review-mobile.png",
    fullPage: true,
  });
});

test("admin editor has a back button and fits small mobile screens", async ({ page }) => {
  const calls = await mockStore(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("button", { name: "Back to products" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/admin-editor-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Back to products" }).click();
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
  expect(calls.saved).toHaveLength(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
