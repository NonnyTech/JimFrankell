import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { pageSEO, seoHead } from "../utils/seo.js";
export default function Metadata() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    document.head
      .querySelectorAll(
        '[data-seo], title, meta[name="description"], meta[name="robots"]',
      )
      .forEach((node) => node.remove());
    document.head.insertAdjacentHTML(
      "beforeend",
      seoHead(pageSEO(pathname, search)),
    );
  }, [pathname, search]);
  return null;
}
