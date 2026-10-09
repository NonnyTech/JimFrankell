import Account from "./pages/Account.jsx";
import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Metadata from "./components/Metadata.jsx";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import FAQ from "./pages/FAQ.jsx";
import NotFound from "./pages/NotFound.jsx";

const Admin = lazy(() => import("./pages/Admin.jsx"));
export default function App() {
  const location = useLocation();
  return (
    <>
      <Metadata />
      <Routes>
        <Route
          path="admin"
          element={
            <Suspense
              fallback={<div className="container section">Loading admin?</div>}
            >
              <Admin />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route
            path="product/:slug"
            element={<ProductDetails key={location.pathname} />}
          />
          <Route path="cart" element={<Cart />} />
          <Route path="account" element={<Account />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
