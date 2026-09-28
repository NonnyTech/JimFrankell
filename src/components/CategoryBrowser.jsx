import { Link } from "react-router-dom";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { categories, products } from "../data/products.js";
import { ProductImage, SectionTitle } from "./UI.jsx";
import "../styles/categories.css";

export default function CategoryBrowser() {
  return <section className="container section category-browser" aria-label="Shop by category">
    <SectionTitle eyebrow="FIND YOUR EVERYDAY ESSENTIALS" title="Shop by category" to="/shop" link="Explore all products" />
    <p className="category-intro">From smarter security to reliable power. Find the right place to start.</p>
    <div className="category-discovery">
      {categories.map((category, index) => {
        const count = products.filter(product => product.category === category.name).length;
        return <Link key={category.name} to={`/shop?category=${encodeURIComponent(category.name)}`}
          className={`category-card discovery-card ${index === 0 ? "discovery-featured" : ""}`}>
          {index === 0 && <span className="category-highlight"><ShieldCheck size={16} /> SECURITY STARTS HERE</span>}
          <div className="category-art"><ProductImage src={category.image} alt="" /></div>
          <div className="category-label"><span className="category-count">{count} {count === 1 ? "product" : "products"}</span>
            <h3>{category.name}</h3><p>{category.description}</p>
            {index === 0 && <span className="category-browse">Explore cameras <ArrowUpRight size={18} /></span>}
          </div>
          {index !== 0 && <span className="category-go" aria-hidden="true"><ArrowUpRight size={18} /></span>}
        </Link>;
      })}
    </div>
  </section>;
}
