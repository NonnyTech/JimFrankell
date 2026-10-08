import { test, expect } from '@playwright/test';
import { products } from '../../src/data/products.js';
const product = { ...products.find(p => p.category === 'Inverters'), published: true };
const orderId = '22222222-2222-4222-8222-222222222222';
async function mock(page, { failFirst = false } = {}) {
  const requests = []; let order;
  await page.route('https://project.supabase.co/**', route => route.fulfill({ json: { access_token: 'test-session', refresh_token: 'refresh', expires_in: 3600, token_type: 'bearer', user: { id: orderId, email: 'admin@example.com', aud: 'authenticated' } } }));
  await page.route('**/api/store?**', async route => {
    const resource = new URL(route.request().url()).searchParams.get('resource');
    let result;
    if (resource === 'config') result = { configured: true, url: 'https://project.supabase.co', key: 'test-public' };
    else if (resource === 'products' || resource === 'admin-products') result = { products: [product], live: true };
    else if (resource === 'orders') {
      const body = route.request().postDataJSON(); requests.push(body);
      if (failFirst && requests.length === 1) return route.fulfill({ status: 503, json: { error: 'Connection failed. Please retry.' } });
      order = { id: orderId, reference: 'JF-TEST123456789ABC', customer: body.customer, status: 'new', created_at: '2026-10-08T10:00:00Z', updated_at: '2026-10-08T10:00:00Z', items: body.items.map(i => ({ productId: i.id, name: product.name + ' (' + i.kva + ' kVA)', price: i.expectedPrice, quantity: i.quantity, subtotal: i.expectedPrice * i.quantity, kva: i.kva, image: product.images[0], slug: product.slug })) };
      order.total = order.items.reduce((sum, i) => sum + i.subtotal, 0); result = { order };
    } else if (resource === 'admin-orders') {
      if (route.request().method() === 'PATCH') order.status = route.request().postDataJSON().status;
      result = { orders: order ? [order] : [], success: true };
    } else result = { reviews: [], enabled: true };
    return route.fulfill({ json: result });
  });
  return requests;
}
test('mobile order saves customer and capacity, retries safely, shows reference and admin can confirm', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests = await mock(page, { failFirst: true });
  await page.goto('/product/' + product.slug);
  await page.getByLabel('Choose inverter capacity (kVA)').selectOption('12');
  await page.getByRole('button', { name: 'Add to basket', exact: true }).click();
  await page.goto('/cart');
  await expect(page.getByRole('link', { name: 'Send order on WhatsApp' })).toHaveCount(0);
  await page.getByLabel('Full name').fill('Test Buyer');
  await page.getByLabel('Phone / WhatsApp number').fill('08012345678');
  await page.getByLabel('Delivery address').fill('20 Example Street, Lagos');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Save order and continue' }).click();
  await expect(page.getByRole('alert')).toContainText('Connection failed');
  await page.getByRole('button', { name: 'Save order and continue' }).click();
  await expect(page.getByRole('heading', { name: 'Order saved' })).toBeVisible();
  expect(requests[0].requestKey).toBe(requests[1].requestKey);
  const link = await page.getByRole('link', { name: 'Send order on WhatsApp' }).getAttribute('href');
  const message = new URL(link).searchParams.get('text');
  expect(message).toContain('JF-TEST123456789ABC'); expect(message).toContain('12 kVA'); expect(message).toContain('450,000'); expect(message).toContain('Test Buyer');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/admin');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.com');
  await page.getByLabel('Password', { exact: true }).fill('not-a-real-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Orders', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'JF-TEST123456789ABC' })).toBeVisible();
  await page.getByLabel('Update status').selectOption('confirmed');
  await page.getByRole('button', { name: 'Save status' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'updated to confirmed' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
