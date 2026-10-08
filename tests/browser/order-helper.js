import { products } from '../../src/data/products.js';
export async function mockOrderEndpoint(page) {
  await page.route('**/api/store?resource=orders', async route => {
    const body = route.request().postDataJSON();
    const items = body.items.map(item => {
      const product = products.find(p => p.id === item.id);
      return { productId: item.id, name: product.name, slug: product.slug, image: product.images[0], kva: item.kva,
        quantity: item.quantity, price: item.expectedPrice, subtotal: item.expectedPrice == null ? null : item.expectedPrice * item.quantity };
    });
    await route.fulfill({ json: { order: { reference: 'JF-TEST123456789ABC', customer: body.customer, items,
      total: items.some(i => i.price == null) ? null : items.reduce((sum, i) => sum + i.subtotal, 0), status: 'new' } } });
  });
}
export async function saveTestOrder(page) {
  await page.getByLabel('Full name').fill('Test Buyer');
  await page.getByLabel('Phone / WhatsApp number').fill('08012345678');
  if (!await page.getByLabel('Delivery address').inputValue()) await page.getByLabel('Delivery address').fill('20 Example Street, Lagos');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Save order and continue' }).click();
}
