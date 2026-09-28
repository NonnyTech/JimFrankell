import React from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import App from "./App.jsx";
export function render(path) {
  return renderToString(
    <StaticRouter location={path}>
      <CartProvider>
        <App />
      </CartProvider>
    </StaticRouter>,
  );
}
