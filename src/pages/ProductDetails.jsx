import { useState } from "react";
import { inverterOptions, selectInverter } from "../utils/inverter-options.js";
import { Link, useParams } from "react-router-dom";
import { ShoppingBag, ShieldCheck } from "lucide-react";
import { useCatalog } from "../context/CatalogContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { formatCurrency as money } from "../utils/currency.js";
import { productMessage } from "../utils/whatsapp.js";
import {
  ProductImage,
  QuantitySelector,
  WhatsAppButton,
  SectionTitle,
} from "../components/UI.jsx";
import { ProductGrid } from "../components/ProductCard.jsx";
import ProductReviews from "../components/ProductReviews.jsx";
import NotFound from "./NotFound.jsx";
export default function ProductDetails() {
  const { products, categories, loading } = useCatalog();
  const { slug } = useParams();
  const p = products.find((p) => p.slug === slug);
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState(null);
  const [image, setImage] = useState(0);
  const { add } = useCart();
  if (!p && loading)
    return (
      <div className="container section" role="status">
        Loading product?
      </div>
    );
  if (!p) return <NotFound />;
  const options = inverterOptions(p);
  const selected = options.find(o => o.kva === (selection?.id === p.id ? selection.kva : null));
  const chosen = selectInverter(p, selected?.kva);
  const ready = !options.length || !!selected;
  const buyingChecks = {
    "Solar Panels": [
      "Panel wattage and dimensions",
      "Compatibility with your inverter and mounting location",
    ],
    Inverters: [
      "Rated output and the appliances you need to power",
      "Battery voltage and solar panel compatibility",
    ],
    "Solar Security Cameras": [
      "Wi-Fi or SIM connectivity for your location",
      "Working lenses, recording storage and installation position",
    ],
    "Spy Cameras": [
      "Power supply and recording storage",
      "Connectivity and suitability for your intended location",
    ],
  }[p.category] || ["Model specifications and compatibility"];

  return (
    <div className="container section">
      <div className="breadcrumbs">
        <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / {p.name}
      </div>
      <div className="detail-grid">
        <div>
          <div className="detail-image">
            <ProductImage
              src={p.images[image] || p.images[0]}
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
          {!p.inStock && <span className="unavailable">On request — contact us for availability</span>}
          <div className="detail-price">
            {options.length && !selected ? `From ${money(Math.min(...options.map(o => o.price)))}` : money(chosen.price)} {!options.length && p.oldPrice && <del>{money(p.oldPrice)}</del>}
          </div>
          <p>{p.shortDescription}</p>
          <p>
            Find the right power for your needs. Our team can help confirm
            compatibility, availability and delivery before you order.
          </p>
          {options.length > 0 && <label className="inverter-choice">Choose inverter capacity (kVA)
            <select value={selected?.kva ?? ""} onChange={e => setSelection({ id: p.id, kva: Number(e.target.value) })}>
              <option value="" disabled>Select a capacity</option>
              {options.map(o => <option key={o.kva} value={o.kva}>{o.kva} kVA — {money(o.price)}</option>)}
            </select>
            <span aria-live="polite">{selected ? `${selected.kva} kVA: ${money(selected.price)}` : "Select a capacity to see your price and add it to your basket."}</span>
          </label>}
          <div className="detail-buy">
            <QuantitySelector value={quantity} onChange={setQuantity} />
            <button
              className="button green"
              disabled={!p.inStock || !ready}
              onClick={() => add(chosen, quantity)}
            >
              <ShoppingBag size={18} /> Add to basket
            </button>
          </div>
          <WhatsAppButton
            className="product-enquiry"
            message={productMessage(chosen)}
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
          <h2>Before you choose</h2>
          <p>Ask our team to confirm these details for the available model:</p>
          <ul>
            {buyingChecks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
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
      <ProductReviews key={p.id} product={p} />
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
