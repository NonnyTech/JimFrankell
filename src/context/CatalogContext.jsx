import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  products as seedProducts,
  categoryDefinitions,
} from "../data/products.js";
import { storeRequest } from "../services/storeService.js";
const CatalogContext = createContext({
  products: seedProducts,
  categories: [],
  loading: false,
  live: false,
});
export const useCatalog = () => useContext(CatalogContext);
export function CatalogProvider({
  children,
  initialProducts = seedProducts,
  initialLive = false,
}) {
  const requestVersion = useRef(0);
  const [products, setProducts] = useState(initialProducts);
  const [live, setLive] = useState(initialLive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      const result = await storeRequest("products");
      if (version !== requestVersion.current) return;
      setProducts(result.products);
      setLive(result.live);
      setError("");
    } catch {
      if (version === requestVersion.current)
        setError(
          "Product updates could not be loaded. Please refresh before requesting a quote.",
        );
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  const categories = categoryDefinitions.flatMap((category) => {
    const matches = products.filter((p) => p.category === category.name);
    return matches.length ? [{ ...category, image: matches[0].images[0] }] : [];
  });
  return (
    <CatalogContext.Provider
      value={{ products, categories, live, loading, error, refresh }}
    >
      {error && (
        <div className="catalog-alert" role="alert">
          {error}{" "}
          <button onClick={refresh} disabled={loading}>
            Retry
          </button>
        </div>
      )}
      {children}
    </CatalogContext.Provider>
  );
}
