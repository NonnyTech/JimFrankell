import { test, expect } from "@playwright/test";
test("hero switches all four scenes, pauses, and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const slides = page.locator(".photo-hero-scene");
  await expect(slides).toHaveCount(4);
  await expect(slides.nth(0)).toHaveClass(/is-active/);
  await expect(slides.nth(1)).toHaveClass(/is-active/, { timeout: 9000 });
  await page
    .getByRole("button", { name: "Pause slideshow", exact: true })
    .click();
  for (let i = 0; i < 4; i++) {
    await page
      .getByRole("button", { name: new RegExp(`Show image ${i + 1}:`) })
      .click();
    await expect(slides.nth(i)).toHaveClass(/is-active/);
  }
  await page.getByRole("button", { name: "Next image", exact: true }).click();
  await expect(slides.nth(0)).toHaveClass(/is-active/);
  await page.screenshot({ path: "test-results/hero-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/hero-mobile.png" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Pause slideshow", exact: true }),
  ).toHaveCount(0);
  await expect(slides.nth(0)).toHaveClass(/is-active/);
});
