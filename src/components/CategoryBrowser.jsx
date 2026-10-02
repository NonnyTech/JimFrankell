import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useCatalog } from "../context/CatalogContext.jsx";
import { ProductImage, SectionTitle } from "./UI.jsx";
import "../styles/categories.css";

export default function CategoryBrowser() {
  const { products, categories, loading } = useCatalog();
  return (
    <section
      className="container section category-browser"
      aria-label="Shop by category"
    >
      <SectionTitle
        eyebrow="SECURITY. ENERGY. PEACE OF MIND."
        title="Find your solution"
        to="/shop"
        link="Shop all products"
      />
      <p className="category-intro">
        Explore our collections. Built around what you need.
      </p>
      <div className="category-discovery">
        {categories.map((category, index) => {
          const count = products.filter(
            (product) => product.category === category.name,
          ).length;
          return (
            <Link
              key={category.name}
              to={`/shop?category=${encodeURIComponent(category.name)}`}
              className={`category-card collection-card collection-${index}`}
            >
              <div className="collection-copy">
                <span className="collection-count">
                  {String(index + 1).padStart(2, "0")} <span /> {count}{" "}
                  {count === 1 ? "product" : "products"}
                </span>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
                <span className="collection-link">
                  Shop collection{" "}
                  <span className="collection-arrow">
                    <ArrowUpRight size={18} />
                  </span>
                </span>
              </div>
              <div className="collection-art">
                <ProductImage src={category.image} alt="" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
