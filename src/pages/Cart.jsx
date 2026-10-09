import OrderCheckout from "../components/OrderCheckout.jsx";
import { useCustomer } from "../context/CustomerContext.jsx";
import { Link } from "react-router-dom";
import { Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatCurrency as money } from "../utils/currency.js";
import {
  EmptyState,
  ProductImage,
  QuantitySelector,
} from "../components/UI.jsx";
export default function Cart() {
  const { session } = useCustomer();
  const {
    items,
    total,
    count,
    update,
    remove,
    clear,
    cartBusy,
    cartError,
    reloadCart,
    importGuest,
  } = useCart();
  return (
    <section className="container section">
      <p className="eyebrow">ONE STEP CLOSER TO BETTER POWER</p>
      <h1>Your basket</h1>
      {cartBusy && <p role="status">Loading or saving your basket?</p>}
      {cartError && (
        <p role="alert">
          {cartError} <button onClick={reloadCart}>Reload saved basket</button>
        </p>
      )}
      {importGuest && (
        <button disabled={cartBusy || !!cartError} onClick={importGuest}>
          Add items from this device?s guest basket
        </button>
      )}
      {!items.length ? (
        <EmptyState
          title="Your basket is empty."
          text="Find the right products for your home or business."
        >
          <Link to="/shop" className="button green">
            Continue shopping
          </Link>
        </EmptyState>
      ) : (
        <div className="cart-layout">
          <div>
            <div className="cart-toolbar">
              <span>{count} items in your basket</span>
              <button onClick={clear}>Clear basket</button>
            </div>
            {items.map(({ product: p, quantity, key }) => (
              <article className="cart-item" key={key}>
                <Link to={`/product/${p.slug}`}>
                  <ProductImage src={p.images[0]} alt={p.name} />
                </Link>
                <div>
                  <span className="eyebrow">{p.category}</span>
                  <h3>
                    <Link to={`/product/${p.slug}`}>{p.name}</Link>
                  </h3>
                  <p>{money(p.price)} each</p>
                  <QuantitySelector
                    value={quantity}
                    onChange={(q) => update(key, q)}
                  />
                </div>
                <div className="cart-item-end">
                  <strong>
                    {money(p.price == null ? null : p.price * quantity)}
                  </strong>
                  <button
                    aria-label={`Remove ${p.name}`}
                    onClick={() => remove(key)}
                  >
                    <Trash2 size={17} /> Remove
                  </button>
                </div>
              </article>
            ))}
            <Link className="text-link" to="/shop">
              <ArrowLeft size={17} /> Continue shopping
            </Link>
          </div>
          <OrderCheckout
            key={session?.user.id || "guest"}
            items={items}
            total={total}
          />
        </div>
      )}
    </section>
  );
}
