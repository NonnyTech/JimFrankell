import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";
import { products as seedProducts } from "../data/products.js";
import { useCatalog } from "../context/CatalogContext.jsx";
import { ProductGrid } from "../components/ProductCard.jsx";
import { EmptyState } from "../components/UI.jsx";
export function filterProducts(params, products = seedProducts) {
  let list = products.filter(
    (p) =>
      (!params.get("category") || p.category === params.get("category")) &&
      (!params.get("brand") || p.brand === params.get("brand")) &&
      (!params.get("stock") ||
        (params.get("stock") === "in" ? p.inStock : !p.inStock)) &&
      [
        p.name,
        p.brand,
        p.category,
        p.description,
        ...Object.values(p.specifications),
      ]
        .join(" ")
        .toLowerCase()
        .includes((params.get("q") || "").toLowerCase()),
  );
  const sort = params.get("sort");
  return list.sort((a, b) =>
    sort === "low"
      ? (a.price ?? Infinity) - (b.price ?? Infinity)
      : sort === "high"
        ? (b.price ?? -Infinity) - (a.price ?? -Infinity)
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : Number(b.featured) - Number(a.featured),
  );
}
export default function Shop() {
  const { products, categories } = useCatalog();
  const [params, setParams] = useSearchParams();
  const change = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };
  const list = filterProducts(params, products);
  return (
    <>
      <div className="page-heading photo-page-heading banner-products">
        <div className="container">
          <p className="eyebrow">THE RIGHT PRODUCTS. A BRIGHTER EVERYDAY.</p>
          <h1>Find your next power solution.</h1>
          <p>
            Explore solar security cameras, panels, inverters and batteries in
            one place.
          </p>
        </div>
      </div>
      <section className="container section shop-layout">
        <aside className="filters">
          <h2>
            <SlidersHorizontal size={19} /> Filters
          </h2>
          <label>
            Search products
            <div className="search-field">
              <Search size={18} />
              <input
                value={params.get("q") || ""}
                onChange={(e) => change("q", e.target.value)}
                placeholder="What are you looking for?"
              />
            </div>
          </label>
          <label>
            Category
            <select
              value={params.get("category") || ""}
              onChange={(e) => change("category", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            Brand
            <select
              value={params.get("brand") || ""}
              onChange={(e) => change("brand", e.target.value)}
            >
              <option value="">All brands</option>
              {[...new Set(products.map((p) => p.brand))].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            Availability
            <select
              value={params.get("stock") || ""}
              onChange={(e) => change("stock", e.target.value)}
            >
              <option value="">All products</option>
              <option value="in">In stock</option>
              <option value="out">On request</option>
            </select>
          </label>
          <button className="clear-filters" onClick={() => setParams({})}>
            Clear filters
          </button>
          <div className="filter-note">
            <h3>Not sure where to start?</h3>
            <p>Our team can help you choose a solution for your needs.</p>
            <a href="/contact">Talk to our team →</a>
          </div>
        </aside>
        <div>
          <div className="catalog-top">
            <p>
              <strong>{list.length}</strong> products
              {params.get("category") && ` in ${params.get("category")}`}
            </p>
            <label>
              Sort by{" "}
              <select
                value={params.get("sort") || "featured"}
                onChange={(e) => change("sort", e.target.value)}
              >
                <option value="featured">Featured</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </label>
          </div>
          {list.length ? (
            <ProductGrid products={list} />
          ) : (
            <EmptyState
              title="No products match your search."
              text="Try a different search or remove a filter."
            >
              <button className="button green" onClick={() => setParams({})}>
                Clear filters
              </button>
            </EmptyState>
          )}
        </div>
      </section>
    </>
  );
}
