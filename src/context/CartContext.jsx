import { useCustomer } from "./CustomerContext.jsx";
import { useCloudCart } from "./useCloudCart.js";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { products as seedProducts } from "../data/products.js";
import { useCatalog } from "./CatalogContext.jsx";
import {
  cartKey,
  inverterOptions,
  selectInverter,
  restoreItems,
} from "../utils/inverter-options.js";
const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);
export function restoreCart(value, products = seedProducts) {
  return restoreItems(value, products);
}
export function CartProvider({ children }) {
  const { products } = useCatalog();
  const [guestCart, setGuestCart] = useState(() => {
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
            .map((i) => ({
              id: i.id,
              quantity: Math.min(i.quantity, 99),
              ...(typeof i.kva === "number" ? { kva: i.kva } : {}),
            }))
        : [];
    } catch {
      return [];
    }
  });
  const customer = useCustomer();
  const cloud = useCloudCart(customer);
  const signedIn = !!customer.session;
  const cart = signedIn ? cloud.items : guestCart;
  const setCart = signedIn ? cloud.change : setGuestCart;
  const [toast, setToast] = useState("");
  const timer = useRef();
  const notify = (message) => {
    setToast(message);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 3500);
  };
  useEffect(() => {
    try {
      localStorage.setItem("jf-cart", JSON.stringify(guestCart));
    } catch {
      /* Cart remains usable when storage is unavailable. */
    }
  }, [guestCart]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const add = (product, quantity = 1) => {
    if (customer.loading || (signedIn && (cloud.busy || cloud.error))) {
      notify("Please wait for your saved basket or reload it.");
      return;
    }
    if (!product.inStock) return;
    if (
      inverterOptions(product).length &&
      !inverterOptions(product).some((o) => o.kva === product.kva)
    ) {
      notify("Please choose an inverter capacity first.");
      return;
    }
    setCart((c) =>
      restoreCart(
        [
          ...c,
          {
            id: product.id,
            quantity,
            ...(product.kva != null ? { kva: product.kva } : {}),
          },
        ],
        products,
      ),
    );
    notify(`${product.name} added to basket`);
  };
  const update = (id, quantity) =>
    setCart((c) =>
      c.map((i) =>
        cartKey(i) === id
          ? { ...i, quantity: Math.max(1, Math.min(99, quantity)) }
          : i,
      ),
    );
  const remove = (id) => {
    setCart((c) => c.filter((i) => cartKey(i) !== id));
    notify("Product removed from basket");
  };
  const clear = () => {
    setCart([]);
    notify("Basket cleared");
  };
  const activeCart = restoreCart(cart, products);
  const items = activeCart.map((i) => ({
    ...i,
    key: cartKey(i),
    product: selectInverter(
      products.find((p) => p.id === i.id),
      i.kva,
    ),
  }));
  return (
    <CartContext.Provider
      value={{
        items,
        cartBusy: customer.loading || cloud.busy,
        cartError: cloud.error,
        reloadCart: cloud.reload,
        importGuest:
          signedIn && guestCart.length
            ? () =>
                cloud.change((current) => {
                  const merged = new Map(current.map((i) => [cartKey(i), i]));
                  for (const item of restoreCart(guestCart, products)) {
                    const existing = merged.get(cartKey(item));
                    merged.set(cartKey(item), {
                      ...item,
                      quantity: Math.max(
                        item.quantity,
                        existing?.quantity || 0,
                      ),
                    });
                  }
                  return [...merged.values()];
                })
            : null,
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
