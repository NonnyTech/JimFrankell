import { test, expect } from "@playwright/test";

test("JF products support category discovery, galleries and enquiry carts", async ({
  page,
}) => {
  await page.goto("/shop?category=Spy+Cameras");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page
    .getByRole("link", { name: "JF Clock Spy Camera", exact: true })
    .first()
    .click();
  await expect(page.locator("h1")).toHaveText("JF Clock Spy Camera");
  await expect(page.locator(".detail-image img")).toHaveAttribute(
    "src",
    "/images/products/jf/spy-clock-cutout.webp",
  );
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await page.goto("/cart");
  await expect(page.locator(".order-summary")).toContainText(
    "Quotation required",
  );
  await page.goto("/product/silver-multi-camera");
  await page.getByRole("button", { name: "View image 2" }).click();
  await expect(page.locator(".detail-image img")).toHaveAttribute(
    "src",
    "/images/products/jf/silver-cutout.webp",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/jf-camera-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("owner videos load on demand and play on product pages", async ({
  page,
}) => {
  for (const slug of ["jf-solar-panel", "jf-hybrid-solar-inverter"]) {
    await page.goto(`/product/${slug}`);
    const video = page.locator(".product-video video");
    await expect(video).toHaveAttribute("preload", "none");
    await expect(video).toHaveAttribute("controls", "");
    await video.evaluate(async (element) => {
      element.muted = true;
      await element.play();
    });
    await expect
      .poll(() => video.evaluate((element) => element.currentTime))
      .toBeGreaterThan(0);
    await video.evaluate((element) => element.pause());
    await expect(page.locator(".detail-price")).toHaveText("Price on request");
  }
});
