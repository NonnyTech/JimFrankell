import { Link } from "react-router-dom";
import { Trash2, ArrowLeft, ShieldCheck } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatCurrency as money } from "../utils/currency.js";
import { cartMessage } from "../utils/whatsapp.js";
import {
  EmptyState,
  ProductImage,
  QuantitySelector,
  WhatsAppButton,
} from "../components/UI.jsx";
export default function Cart() {
  const { items, total, count, update, remove, clear } = useCart();
  const needsQuote = items.some((i) => i.product.price == null);
  return (
    <section className="container section">
      <p className="eyebrow">ONE STEP CLOSER TO BETTER POWER</p>
      <h1>Your shopping cart</h1>
      {!items.length ? (
        <EmptyState
          title="Your cart is currently empty."
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
              <span>{count} items in your cart</span>
              <button onClick={clear}>Clear cart</button>
            </div>
            {items.map(({ product: p, quantity }) => (
              <article className="cart-item" key={p.id}>
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
                    onChange={(q) => update(p.id, q)}
                  />
                </div>
                <div className="cart-item-end">
                  <strong>
                    {money(p.price == null ? null : p.price * quantity)}
                  </strong>
                  <button
                    aria-label={`Remove ${p.name}`}
                    onClick={() => remove(p.id)}
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
          <aside className="order-summary">
            <h2>Order summary</h2>
            <div>
              <span>Cart subtotal</span>
              <strong>
                {needsQuote ? "Quotation required" : money(total)}
              </strong>
            </div>
            {needsQuote && (
              <p>
                Some items need a price confirmation. Our team will quote your
                complete order on WhatsApp.
              </p>
            )}
            <p>
              Delivery cost and availability will be confirmed by our team on
              WhatsApp.
            </p>
            <WhatsAppButton
              message={cartMessage(items)}
              className="button green full"
            >
              Continue order on WhatsApp
            </WhatsAppButton>
            <span className="summary-note">
              <ShieldCheck size={19} /> No payment is taken on this website.
            </span>
            <p>
              Your cart will be included in the message. Send it on WhatsApp to
              start your order.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
