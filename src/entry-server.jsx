import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { CatalogProvider } from "./context/CatalogContext.jsx";
import App from "./App.jsx";
export function render(path, products, live = false) {
  return renderToString(
    <StaticRouter location={path}>
      <CatalogProvider initialProducts={products} initialLive={live}>
        <CartProvider>
          <App />
        </CartProvider>
      </CatalogProvider>
    </StaticRouter>,
  );
}
