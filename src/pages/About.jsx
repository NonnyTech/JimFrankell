import { Link } from "react-router-dom";
import { ArrowUpRight, Check } from "lucide-react";
import { businessConfig as b } from "../config/businessConfig.js";
import { categories } from "../data/products.js";
import { WhatsAppButton } from "../components/UI.jsx";
// Neutral introductory copy. The owner should approve all company copy before launch.
export default function About() {
  return (
    <>
      <section className="page-heading photo-page-heading banner-installation">
        <div className="container">
          <p className="eyebrow">POWERING POSSIBILITIES</p>
          <h1>
            Better energy. <br />A better everyday.
          </h1>
          <p>Meet {b.companyName} — solar security and reliable power solutions.</p>
        </div>
      </section>
      <section className="container section about-grid">
        <img
          src="/images/about-camera-installation.webp"
          alt="Two technicians installing a solar-powered security camera outside a home, with one checking a tablet"
          width={1359}
          height={1158}
          loading="lazy"
        />
        <div>
          <p className="eyebrow">WHO WE ARE</p>
          <h2>Your next step towards reliable power.</h2>
          <p>
            {b.companyName} offers solar security cameras and power solutions
            for homes and businesses. We help
            customers explore their options and choose products that suit their
            everyday needs.
          </p>
          <h3>What we do</h3>
          <p>
            Our catalog brings together solar CCTV cameras, solar panels,
            inverters, energy storage, complete solar kits and installation
            accessories, with a straightforward way to enquire and order through
            WhatsApp.
          </p>
          <h3>Our mission</h3>
          <p>
            To make reliable energy and useful technology easier to understand,
            choose and bring into everyday life.
          </p>
        </div>
      </section>
      <section className="soft-section section">
        <div className="container why-grid">
          <div>
            <p className="eyebrow">A PRACTICAL APPROACH</p>
            <h2>Why choose us?</h2>
            <p>
              Helpful guidance, clear product information and direct
              conversations about what you need.
            </p>
          </div>
          <div className="why-items">
            {[
              "Product guidance",
              "Solar & power options",
              "Direct customer support",
              "Simple WhatsApp ordering",
            ].map((t) => (
              <div key={t}>
                <Check size={20} />
                <h3>{t}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <p className="eyebrow">PRODUCTS & SOLUTIONS</p>
        <h2>One place. More possibilities.</h2>
        <div className="category-links">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={"/shop?category=" + encodeURIComponent(c.name)}
            >
              {c.name}
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
        <div className="help-card">
          <h2>Let’s power what’s next.</h2>
          <p>
            Tell us what you have in mind. We’ll help you explore your options.
          </p>
          <WhatsAppButton />
        </div>
      </section>
    </>
  );
}
