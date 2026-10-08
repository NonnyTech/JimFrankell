import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrder, validateOrder, adminOrders } from '../server/orders.js';
import { handleStore } from '../server/store.js';
import { products } from '../src/data/products.js';
const product = products.find(p => p.category === 'Inverters');
const requestKey = '11111111-1111-4111-8111-111111111111';
const input = () => ({ requestKey, consent: true, customer: { name: 'Test Buyer', phone: '08012345678', fulfilment: 'delivery', address: '20 Example Street, Lagos', installation: 'No, products only', notes: '' }, items: [{ id: product.id, kva: 12, quantity: 2, expectedPrice: 450000 }] });
function mock({ hidden = false } = {}) {
  let saved;
  const calls = [];
  return { calls, get saved() { return saved; }, async limit(...args) { calls.push(args); }, async audit() {}, async rest(path, options = {}) {
    calls.push({ path, options });
    if (path.startsWith('store_products')) return hidden ? [] : [{ id: product.id, slug: product.slug, data: product }];
    if (options.method === 'POST') { saved ||= JSON.parse(options.body); return null; }
    return saved ? [saved] : [];
  } };
}
test('orders use catalog snapshots and prices, keep references stable and ignore forged status/totals', async () => {
  const db = mock(); const body = { ...input(), total: 1, status: 'completed' };
  const first = await createOrder(db, body, 'ip');
  assert.equal(first.total, 900000); assert.equal(first.status, 'new');
  assert.equal(first.items[0].price, 450000); assert.match(first.items[0].name, /12 kVA/);
  assert.match(first.reference, /^JF-[A-F0-9]{16}$/);
  assert.equal((await createOrder(db, body, 'ip')).reference, first.reference);
  assert.equal(db.calls.filter(c => c.options?.method === 'POST').length, 1);
  assert.equal(first.request_hash, undefined); assert.equal(first.request_key, undefined);
  await assert.rejects(createOrder(db, { ...body, customer: { ...body.customer, name: 'Another person' } }, 'ip'), e => e.status === 409);
});
test('orders reject hidden products, stale prices, missing capacities and invalid customer data', async () => {
  await assert.rejects(createOrder(mock({ hidden: true }), input(), 'ip'), e => e.status === 409);
  for (const change of [{ expectedPrice: 1 }, { kva: 99 }, { kva: null }]) {
    const body = input(); body.items[0] = { ...body.items[0], ...change };
    await assert.rejects(createOrder(mock(), body, 'ip'), e => e.status === 409);
  }
  for (const change of [{ consent: false }, { items: [] }, { requestKey: 'bad' }, { customer: { ...input().customer, phone: 'invalid' } }, { customer: { ...input().customer, address: '' } }])
    assert.throws(() => validateOrder({ ...input(), ...change }));
});
test('anonymous and non-admin callers cannot read or update orders', async () => {
  const env = { SUPABASE_URL: 'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'secret', SUPABASE_PUBLISHABLE_KEY: 'public' };
  const fetcher = async url => new Response(JSON.stringify(url.includes('/auth/v1/user') ? { id: requestKey } : []));
  for (const method of ['GET', 'PATCH']) {
    const req = { method, query: { resource: 'admin-orders' }, body: {}, contentType: 'application/json' };
    assert.equal((await handleStore(req, env, fetcher)).status, 401);
    assert.equal((await handleStore({ ...req, token: 'nonadmin' }, env, fetcher)).status, 403);
  }
});
test('order moderation updates only status and detects concurrent edits', async () => {
  const calls = [];
  const body = { id: requestKey, status: 'confirmed', updatedAt: '2026-10-08T00:00:00Z', total: 1, customer: {} };
  const db = { async rest(path, options) { calls.push({ path, body: JSON.parse(options.body) }); return [{ id: requestKey }]; }, async audit() {} };
  await adminOrders(db, { method: 'PATCH' }, body, { id: requestKey });
  assert.deepEqual(Object.keys(calls[0].body).sort(), ['status', 'updated_at', 'updated_by']);
  assert.match(calls[0].path, /updated_at=eq/);
  await assert.rejects(adminOrders({ ...db, rest: async () => [] }, { method: 'PATCH' }, body, { id: requestKey }), e => e.status === 409);
});
