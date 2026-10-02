import "@fontsource-variable/dm-sans/wght.css";
import "@fontsource-variable/manrope/wght.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./context/CartContext.jsx";
import { CatalogProvider } from "./context/CatalogContext.jsx";
import App from "./App.jsx";
import "./styles/global.css";
class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="empty">
        <h1>Something went wrong.</h1>
        <p>Please refresh the page to try again.</p>
        <a href="/" className="button green">
          Return home
        </a>
      </div>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <CatalogProvider
          initialProducts={window.__JF_CATALOG__?.products}
          initialLive={window.__JF_CATALOG__?.live}
        >
          <CartProvider>
            <App />
          </CartProvider>
        </CatalogProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
