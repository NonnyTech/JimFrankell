import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../src/data/products.js";
import { validateProduct } from "../server/catalog-validation.js";
import { unpackProduct } from "../server/store-db.js";
import { restoreItems, selectInverter, defaultInverterOptions } from "../src/utils/inverter-options.js";
import { cartMessage } from "../src/utils/whatsapp.js";
const product = { ...products.find(p => p.category === "Inverters"), published: true };

test("inverter capacities validate and set the minimum price, with no options on other categories", () => {
  assert.equal(validateProduct(product).price, 180000);
  assert.deepEqual(validateProduct(product).inverterOptions, defaultInverterOptions);
  for (const options of [[{ kva: 0, price: 100 }], [{ kva: 2, price: -1 }], [{ kva: 2, price: 1.234 }], [{ kva: 2, price: 10 }, { kva: 2, price: 20 }]])
    assert.throws(() => validateProduct({ ...product, inverterOptions: options }));
  assert.throws(() => validateProduct({ ...product, category: "Solar Panels" }));
});
test("basket keeps capacities separate across reloads and uses current catalog prices", () => {
  const saved = [{ id: product.id, kva: 12, quantity: 2, price: 1 }, { id: product.id, kva: 8, quantity: 1 }, { id: product.id, kva: 12, quantity: 1 }];
  const restored = restoreItems(JSON.parse(JSON.stringify(saved)), [product]);
  assert.equal(restored.length, 2);
  assert.equal(restored[0].quantity, 3);
  const items = restored.map(i => ({ ...i, product: selectInverter(product, i.kva) }));
  assert.equal(items[0].product.price, 450000);
  assert.equal(items[1].product.price, 350000);
  assert.match(cartMessage(items), /12 kVA/);
  assert.match(cartMessage(items), /8 kVA/);
  assert.match(cartMessage(items), /1,700,000/);
  assert.deepEqual(restoreItems([{ id: product.id, quantity: 1 }, { id: product.id, kva: 99, quantity: 1 }], [product]), []);
});
test("initial prices support the existing database listing but never overwrite admin edits", () => {
  const data = { ...product };
  delete data.inverterOptions;
  const row = { id: product.id, slug: product.slug, data };
  assert.deepEqual(unpackProduct(row).inverterOptions, defaultInverterOptions);
  assert.deepEqual(unpackProduct({ ...row, data: { ...data, inverterOptions: [] } }).inverterOptions, []);
  const edited = [{ kva: 2, price: 230000 }];
  assert.deepEqual(unpackProduct({ ...row, data: { ...data, inverterOptions: edited } }).inverterOptions, edited);
});
