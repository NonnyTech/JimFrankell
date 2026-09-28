import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { products } from "../data/products.js";
import { useCart } from "../context/CartContext.jsx";
import { formatCurrency as money } from "../utils/currency.js";
import { cartMessage, productMessage } from "../utils/whatsapp.js";
import {
  ProductImage,
  QuantitySelector,
  WhatsAppButton,
  SectionTitle,
} from "../components/UI.jsx";
import { ProductGrid } from "../components/ProductCard.jsx";
import NotFound from "./NotFound.jsx";
export default function ProductDetails() {
  const { slug } = useParams();
  const p = products.find((p) => p.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [image, setImage] = useState(0);
  const { add } = useCart();
  if (!p) return <NotFound />;
  return (
    <div className="container section">
      <div className="breadcrumbs">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {p.name}
      </div>
      <div className="detail-grid">
        <div>
          <div className="detail-image">
            <ProductImage
              src={p.images[image]}
              alt={`${p.name}, view ${image + 1}`}
            />
          </div>
          <div className="thumbnails">
            {p.images.map((src, i) => (
              <button
                key={src}
                className={image === i ? "selected" : ""}
                onClick={() => setImage(i)}
                aria-label={`View image ${i + 1}`}
                aria-pressed={image === i}
              >
                <ProductImage src={src} alt={`${p.name} thumbnail ${i + 1}`} />
              </button>
            ))}
          </div>
          {p.videos?.map((video) => (
            <figure className="product-video" key={video.src}>
              <video
                controls
                preload="none"
                playsInline
                poster={p.images[0]}
                aria-label={video.title}
              >
                <source src={video.src} type="video/mp4" />
                Your browser does not support video.{" "}
                <a href={video.src}>Download the product video</a>.
              </video>
              <figcaption>{video.title}</figcaption>
            </figure>
          ))}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            {p.category} · {p.brand}
          </p>
          <h1>{p.name}</h1>
          <span className={p.inStock ? "stock" : "unavailable"}>
            ●{" "}
            {p.inStock
              ? p.stockLabel || "In stock"
              : "On request — contact us for availability"}
          </span>
          <div className="detail-price">
            {money(p.price)} {p.oldPrice && <del>{money(p.oldPrice)}</del>}
          </div>
          <p>{p.shortDescription}</p>
          <p>
            Find the right power for your needs. Our team can help confirm
            compatibility, availability and delivery before you order.
          </p>
          <div className="detail-buy">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <button
              className="button green"
              disabled={!p.inStock}
              onClick={() => add(p, quantity)}
            >
              <ShoppingBag size={18} /> Add to cart
            </button>
          </div>
          {p.inStock && (
            <WhatsAppButton
              className="button outline full"
              message={cartMessage([{ product: p, quantity }])}
            >
              Order on WhatsApp
            </WhatsAppButton>
          )}
          <WhatsAppButton
            className="product-enquiry"
            message={productMessage(p)}
          >
            Ask about this product
          </WhatsAppButton>
          <div className="warranty-note">
            <ShieldCheck size={20} />
            <span>{p.warranty}</span>
          </div>
        </div>
      </div>
      <div className="detail-information">
        <section>
          <h2>Full description</h2>
          <p>{p.description}</p>
          <h2>Warranty</h2>
          <p>{p.warranty}</p>
        </section>
        <section>
          <h2>Specifications</h2>
          <dl>
            {Object.entries(p.specifications).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      <SectionTitle
        eyebrow="COMPLETE YOUR SETUP"
        title="Related products"
        to="/shop"
      />
      <ProductGrid
        products={products
          .filter(
            (other) =>
              other.id !== p.id &&
              (other.category === p.category || other.featured),
          )
          .slice(0, 4)}
      />
    </div>
  );
}
