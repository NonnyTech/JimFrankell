import { useState } from "react";
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
  const [details, setDetails] = useState({ location: "", installation: "Not sure yet", notes: "" });
  const setDetail = (key, value) => setDetails((current) => ({ ...current, [key]: value }));
  const needsQuote = items.some((i) => i.product.price == null);
  return (
    <section className="container section">
      <p className="eyebrow">ONE STEP CLOSER TO BETTER POWER</p>
      <h1>Your quote basket</h1>
      {!items.length ? (
        <EmptyState
          title="Your quote basket is empty."
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
              <span>{count} items in your quote basket</span>
              <button onClick={clear}>Clear basket</button>
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
            <h2>Request your quote</h2>
            <div>
              <span>Product total</span>
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
            <div className="quote-fields">
              <label htmlFor="quote-location">Delivery area (optional)</label>
              <input id="quote-location" autoComplete="address-level2" maxLength={120} placeholder="e.g. Ikeja, Lagos" value={details.location} onChange={(e) => setDetail("location", e.target.value)} />
              <label htmlFor="quote-installation">Do you need installation?</label>
              <select id="quote-installation" value={details.installation} onChange={(e) => setDetail("installation", e.target.value)}>
                <option>Not sure yet</option><option>Yes, please include installation</option><option>No, products only</option>
              </select>
              <label htmlFor="quote-notes">Anything else? (optional)</label>
              <textarea id="quote-notes" rows={3} maxLength={600} placeholder="Tell us about your property or what you need." value={details.notes} onChange={(e) => setDetail("notes", e.target.value)} />
            </div>
            <WhatsAppButton
              message={cartMessage(items, details)}
              className="button green full"
            >
              Request quote on WhatsApp
            </WhatsAppButton>
            <span className="summary-note">
              <ShieldCheck size={19} /> No payment is taken on this website.
            </span>
            <p>
              Your products and enquiry details will be included. Send the message on WhatsApp to
              request your quote.
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
