import { createContext, useContext, useEffect, useRef, useState } from "react";
import { products as seedProducts } from "../data/products.js";
import { useCatalog } from "./CatalogContext.jsx";
const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
export function restoreCart(value, products = seedProducts) {
  if (!Array.isArray(value)) return [];
  return products
    .filter((p) => p.inStock)
    .flatMap((p) => {
      const quantity = value
        .filter(
          (i) =>
            i &&
            i.id === p.id &&
            Number.isInteger(i.quantity) &&
            i.quantity > 0,
        )
        .reduce((s, i) => s + i.quantity, 0);
      return quantity ? [{ id: p.id, quantity: Math.min(quantity, 99) }] : [];
    });
}
export function CartProvider({ children }) {
  const { products } = useCatalog();
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("jf-cart") || "[]");
      return Array.isArray(saved)
        ? saved
            .filter(
              (i) =>
                i &&
                Number.isSafeInteger(i.id) &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0,
            )
            .map((i) => ({ id: i.id, quantity: Math.min(i.quantity, 99) }))
        : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState("");
  const timer = useRef();
  const notify = (message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3500);
  };
  useEffect(() => {
    try {
      localStorage.setItem("jf-cart", JSON.stringify(cart));
    } catch {
      /* Cart remains usable when storage is unavailable. */
    }
  }, [cart]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const add = (product, quantity = 1) => {
    if (!product.inStock) return;
    setCart((c) => restoreCart([...c, { id: product.id, quantity }], products));
    notify(`${product.name} added to quote basket`);
  };
  const update = (id, quantity) =>
    setCart((c) =>
      c.map((i) =>
        i.id === id
          ? { ...i, quantity: Math.max(1, Math.min(99, quantity)) }
          : i,
      ),
    );
  const remove = (id) => {
    setCart((c) => c.filter((i) => i.id !== id));
    notify("Product removed from quote basket");
  };
  const clear = () => {
    setCart([]);
    notify("Quote basket cleared");
  };
  const activeCart = restoreCart(cart, products);
  const items = activeCart.map((i) => ({
    ...i,
    product: products.find((p) => p.id === i.id),
  }));
  return (
    <CartContext.Provider
      value={{
        items,
        add,
        update,
        remove,
        clear,
        notify,
        count: activeCart.reduce((s, i) => s + i.quantity, 0),
        total: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      }}
    >
      {children}
      <div className={`toast ${toast ? "visible" : ""}`} role="status">
        {toast}
      </div>
    </CartContext.Provider>
  );
}
