import { test, expect } from "@playwright/test";
test("supplied camera photos appear on home, category and detail pages with honest quote pricing", async ({
  page,
}) => {
  await page.goto("/");
  const cards = page.locator(".soft-section .product-card");
  await expect(cards).toHaveCount(8);
  for (const image of await cards.locator(".product-image img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveAttribute("src", /\.(jpg|png|webp)$/);
    await expect
      .poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  }
  await page
    .locator(".category-card")
    .filter({ hasText: "Solar Security Cameras" })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(9);
  await page
    .locator(".product-card")
    .first()
    .getByRole("link", { name: "View details" })
    .click();
  await expect(page.locator(".detail-price")).toHaveText("Price on request");
  await expect(page.locator(".detail-image img")).toHaveAttribute(
    "src",
    "/images/products/jf/camera-floodlight-cutout.webp",
  );
  await page.getByRole("button", { name: "Add to quote", exact: true }).click();
  await page.getByRole("link", { name: "Quote basket, 1 items" }).click();
  await expect(page.locator(".order-summary")).toContainText(
    "Quotation required",
  );
  await expect(page.locator(".cart-item-end")).toContainText(
    "Price on request",
  );
  await page.reload();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shop?category=Solar+Security+Cameras");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/security-mobile.png",
    fullPage: true,
  });
});
