import { test, expect } from "@playwright/test";
import { products } from "../../src/data/products.js";
const inverter = { ...products.find(p => p.category === "Inverters"), published: true };

async function mock(page) {
  let current = structuredClone(inverter);
  await page.route("https://project.supabase.co/**", route => route.fulfill({ json: {
    access_token: "test-session", refresh_token: "test-refresh", expires_in: 3600, token_type: "bearer",
    user: { id: "11111111-1111-4111-8111-111111111111", email: "admin@example.com", aud: "authenticated" }
  } }));
  await page.route("**/api/store?**", async route => {
    const resource = new URL(route.request().url()).searchParams.get("resource");
    let result;
    if (resource === "config") result = { configured: true, url: "https://project.supabase.co", key: "test-public" };
    else if (resource === "products") result = { products: [current], live: true };
    else if (resource === "admin-products") {
      if (route.request().method() !== "GET") current = { ...current, ...route.request().postDataJSON() };
      result = { products: [current], product: current };
    } else result = { reviews: [], enabled: true };
    await route.fulfill({ json: result });
  });
  return () => current;
}

test("mobile customer chooses kVA, retains both capacities after reload and sends accurate quote", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mock(page);
  await page.goto('/product/' + inverter.slug);
  const add = page.getByRole('button', { name: 'Add to basket', exact: true });
  await expect(add).toBeDisabled();
  await page.getByLabel('Choose inverter capacity (kVA)').selectOption('12');
  await expect(page.locator('.detail-price')).toContainText('450,000');
  await add.click();
  await page.getByLabel('Choose inverter capacity (kVA)').selectOption('8');
  await add.click();
  await page.goto('/cart');
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(2);
  await expect(page.locator('.order-summary')).toContainText('800,000');
  const href = await page.getByRole('link', { name: 'Send order on WhatsApp' }).getAttribute('href');
  const message = new URL(href).searchParams.get('text');
  expect(message).toContain('12 kVA'); expect(message).toContain('8 kVA'); expect(message).toContain('800,000');
  await page.getByRole('button', { name: 'Remove ' + inverter.name + ' (12 kVA)', exact: true }).click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await expect(page.locator('.order-summary')).toContainText('350,000');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("admin edits capacity prices, persists them and fields only appear for inverters", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const current = await mock(page);
  await page.goto('/admin');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.com');
  await page.getByLabel('Password', { exact: true }).fill('not-a-real-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Capacity 1 price (NGN)', { exact: true }).fill('460000');
  await page.getByRole('button', { name: 'Add capacity', exact: true }).click();
  await page.getByLabel('Capacity 7 (kVA)', { exact: true }).fill('10');
  await page.getByLabel('Capacity 7 price (NGN)', { exact: true }).fill('400000');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Product saved' })).toBeVisible();
  expect(current().inverterOptions).toContainEqual({ kva: 10, price: 400000 });
  await page.reload();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.getByLabel('Capacity 1 price (NGN)', { exact: true })).toHaveValue('460000');
  await page.getByLabel('Category', { exact: true }).selectOption('Solar Panels');
  await expect(page.getByText('Inverter capacities and prices', { exact: true })).toHaveCount(0);
  await page.goto('/product/' + inverter.slug);
  await page.getByLabel('Choose inverter capacity (kVA)').selectOption('12');
  await expect(page.locator('.detail-price')).toContainText('460,000');
});
