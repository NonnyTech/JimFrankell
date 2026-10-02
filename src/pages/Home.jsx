import CategoryBrowser from "../components/CategoryBrowser.jsx";
import HeroSlideshow from "../components/HeroSlideshow.jsx";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Headphones,
  Truck,
  BadgeCheck,
  Check,
  House,
  Building2,
  Store,
  Factory,
} from "lucide-react";
import { useCatalog } from "../context/CatalogContext.jsx";
import { businessConfig as b } from "../config/businessConfig.js";
import { ProductGrid } from "../components/ProductCard.jsx";
import {
  SectionTitle,
  ProductImage,
  WhatsAppButton,
} from "../components/UI.jsx";
export default function Home() {
  const { products, categories, loading } = useCatalog();
  return (
    <>
      <HeroSlideshow />
      <div className="container benefits">
        {[
          [
            ShieldCheck,
            "Quality products",
            "Selected for dependable performance",
          ],
          [Headphones, "Expert support", "Guidance that makes a difference"],
          [Truck, "Reliable delivery", "Let’s plan your delivery together"],
          [BadgeCheck, "Trusted solutions", "The right power for your needs"],
        ].map(([Icon, title, text]) => (
          <div key={title}>
            <Icon size={27} />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>
      <CategoryBrowser />
      <section className="section soft-section">
        <div className="container">
          <SectionTitle
            eyebrow="POWER PICKS"
            title="Featured products"
            to="/shop"
          />
          <ProductGrid
            products={products
              .filter((p) => p.featured)
              .sort((a, b) => (a.featuredRank ?? 100) - (b.featuredRank ?? 100))
              .slice(0, 8)}
          />
        </div>
      </section>
      <section className="container section">
        <div className="solution-banner">
          <div>
            <p className="eyebrow">LESS DOWNTIME. MORE POSSIBILITIES.</p>
            <h2>
              Reliable power.
              <br />
              For everything that matters.
            </h2>
            <p>
              From your first solar panel to a complete energy system,
              <br className="desktop-break" /> we’ll help you find the right
              fit.
            </p>
            <WhatsAppButton className="button light">
              Let’s talk about your power needs <ArrowUpRight size={17} />
            </WhatsAppButton>
          </div>
          <div className="banner-art">
            <ProductImage
              src="/images/products/jf/panel-cutout.webp"
              alt="JF solar panel"
            />
            <span>YOUR NEXT CHAPTER. SOLAR POWERED.</span>
          </div>
        </div>
      </section>
      {products.some((p) => p.bestSeller) && (
        <section className="container section best-section">
          <SectionTitle
            eyebrow="CUSTOMER FAVOURITES"
            title="Best sellers"
            to="/shop"
          />
          <ProductGrid products={products.filter((p) => p.bestSeller)} />
        </section>
      )}
      <section className="why-section">
        <div className="container why-grid">
          <div>
            <p className="eyebrow">MORE THAN PRODUCTS</p>
            <h2>
              Why choose <br />
              {b.shortName}?
            </h2>
            <p>
              Good energy starts with the right partner. We make finding your
              next power solution simple.
            </p>
            <Link to="/about" className="text-link">
              Get to know us <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="why-items">
            {[
              "Quality & tested products",
              "Competitive pricing",
              "Expert product guidance",
              "Reliable customer support",
              "Solar & power solutions",
              "Fast response on WhatsApp",
            ].map((t) => (
              <div key={t}>
                <span>
                  <Check size={18} />
                </span>
                <h3>{t}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <SectionTitle
          eyebrow="MADE FOR YOUR WORLD"
          title="Solar solutions for every need"
        />
        <div className="solutions-grid">
          {[
            [House, "Home", "Keep your everyday essentials powered."],
            [Building2, "Office", "Power a more productive working day."],
            [Store, "Business", "Energy that works as hard as you do."],
            [
              Factory,
              "Large power",
              "Explore options for bigger energy needs.",
            ],
          ].map(([Icon, name, text]) => (
            <article key={name}>
              <Icon size={30} />
              <h3>{name} solar solutions</h3>
              <p>{text}</p>
              <WhatsAppButton
                className="text-link"
                message={`Hello ${b.shortName}, I would like a quote for ${name.toLowerCase()} solar solutions.`}
              >
                Get a quote <ArrowUpRight size={16} />
              </WhatsAppButton>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
