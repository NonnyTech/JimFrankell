import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext.jsx";
import { pageSEO, seoHead } from "../utils/seo.js";
export default function Metadata() {
  const { products } = useCatalog();
  const { pathname, search } = useLocation();
  useEffect(() => {
    document.head
      .querySelectorAll(
        '[data-seo], title, meta[name="description"], meta[name="robots"]',
      )
      .forEach((node) => node.remove());
    document.head.insertAdjacentHTML(
      "beforeend",
      seoHead(pageSEO(pathname, search, undefined, products)),
    );
  }, [pathname, search, products]);
  return null;
}
