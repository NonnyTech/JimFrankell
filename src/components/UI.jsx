import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  MessageCircle,
  Plus,
  Minus,
  ShoppingBag,
} from "lucide-react";
import { whatsappUrl } from "../utils/whatsapp.js";
import { useCart } from "../context/CartContext.jsx";
export function WhatsAppButton({
  children = "Chat on WhatsApp",
  message,
  className = "button green",
  ...props
}) {
  const { notify } = useCart();
  const url = whatsappUrl(message);
  return (
    <a
      href={url || "#whatsapp-unavailable"}
      target={url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={className}
      onClick={(e) => {
        if (!url) {
          e.preventDefault();
          notify(
            "WhatsApp contact is being updated. Please use the contact form.",
          );
        }
      }}
      {...props}
    >
      <MessageCircle size={18} />
      {children}
    </a>
  );
}
export function ProductImage({ src, alt, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/images/products/fallback.svg";
      }}
      {...props}
    />
  );
}
export function QuantitySelector({ value, onChange }) {
  return (
    <div className="quantity">
      <button
        aria-label="Decrease quantity"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
      >
        <Minus size={15} />
      </button>
      <span aria-label="Quantity">{value}</span>
      <button
        aria-label="Increase quantity"
        disabled={value >= 99}
        onClick={() => onChange(value + 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  to,
  link = "View all products",
}) {
  return (
    <div className="section-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {to && (
        <Link className="text-link" to={to}>
          {link}
          <ArrowUpRight size={18} />
        </Link>
      )}
    </div>
  );
}
export function EmptyState({ title, text, children }) {
  return (
    <div className="empty">
      <ShoppingBag size={42} />
      <h2>{title}</h2>
      <p>{text}</p>
      {children}
    </div>
  );
}
