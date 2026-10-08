export const defaultInverterOptions = [
  { kva: 12, price: 450000 },
  { kva: 8, price: 350000 },
  { kva: 5.6, price: 300000 },
  { kva: 3.5, price: 280000 },
  { kva: 2, price: 220000 },
  { kva: 1.5, price: 180000 },
];

export const inverterOptions = (product) =>
  product.category === "Inverters" ? product.inverterOptions || [] : [];

export function selectInverter(product, kva) {
  const option = inverterOptions(product).find((item) => item.kva === kva);
  return option ? { ...product, kva: option.kva, price: option.price, oldPrice: null,
    name: `${product.name} (${option.kva} kVA)` } : product;
}

export const cartKey = (item) => `${item.id}:${item.kva ?? ""}`;

export function restoreItems(value, products) {
  if (!Array.isArray(value)) return [];
  const items = new Map();
  for (const item of value) {
    if (!item || !Number.isInteger(item.quantity) || item.quantity <= 0) continue;
    const product = products.find((p) => p.id === item.id && p.inStock);
    if (!product) continue;
    const options = inverterOptions(product);
    if (options.length && !options.some((option) => option.kva === item.kva)) continue;
    if (!options.length && item.kva != null) continue;
    const entry = { id: product.id, quantity: item.quantity, ...(options.length ? { kva: item.kva } : {}) };
    const key = cartKey(entry);
    entry.quantity = Math.min(99, (items.get(key)?.quantity || 0) + entry.quantity);
    items.set(key, entry);
  }
  return [...items.values()];
}
