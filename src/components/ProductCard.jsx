import { Link } from "react-router-dom";
import { Plus, ArrowUpRight } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { formatCurrency } from "../utils/currency.js";
import { productMessage } from "../utils/whatsapp.js";
import { ProductImage, WhatsAppButton } from "./UI.jsx";
import "../styles/product-cards.css";
export default function ProductCard({ product: p }) {
  const { add } = useCart();
  return (
    <article className="product-card catalog-card">
      <Link to={`/product/${p.slug}`} className="product-image">
        {p.bestSeller && <span className="badge">BEST SELLER</span>}
        <ProductImage src={p.images[0]} alt={p.name} />
        <span className="image-arrow">
          <ArrowUpRight size={19} />
        </span>
      </Link>
      <div className="product-content">
        <div className="product-meta">
          <span>{p.category}</span>
          <span className={p.inStock ? "stock" : "unavailable"}>
            ● {p.inStock ? p.stockLabel || "In stock" : "On request"}
          </span>
        </div>
        <h3>
          <Link to={`/product/${p.slug}`}>{p.name}</Link>
        </h3>
        <p>{p.shortDescription}</p>
        <div className="price">
          {formatCurrency(p.price)}{" "}
          {p.oldPrice && <del>{formatCurrency(p.oldPrice)}</del>}
        </div>
        <div className="card-actions">
          <Link to={`/product/${p.slug}`}>View details</Link>
          <button
            disabled={!p.inStock}
            onClick={() => add(p)}
            aria-label={`Add ${p.name} to quote basket`}
          >
            <Plus size={17} /> Add to quote
          </button>
        </div>
        <WhatsAppButton className="product-enquiry" message={productMessage(p)}>
          Ask on WhatsApp
        </WhatsAppButton>
      </div>
    </article>
  );
}
export function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
