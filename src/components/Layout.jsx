import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  ArrowRight,
  Instagram,
  Facebook,
  Linkedin,
} from "lucide-react";
import { businessConfig as b } from "../config/businessConfig.js";
import { useCart } from "../context/CartContext.jsx";
import { WhatsAppButton } from "./UI.jsx";
export function Logo() {
  return (
    <Link to="/" className="logo">
      <img src={b.logo} alt="" width="48" height="58" />
      <span>
        {b.shortName}
        <small>SOLAR & SECURITY & POWER</small>
      </span>
    </Link>
  );
}
export default function Layout() {
  const { count } = useCart();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    setMenu(false);
    setSearch(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="announcement">
        <span>Quality solar & electrical solutions. A brighter everyday.</span>
        <WhatsAppButton className="announcement-link">
          Talk to an expert <ArrowRight size={13} />
        </WhatsAppButton>
      </div>
      <header>
        <div className="container header-inner">
          <Logo />
          <nav aria-label="Main navigation" className={menu ? "open" : ""}>
            {[
              ["/", "Home"],
              ["/shop", "Shop"],
              ["/about", "About Us"],
              ["/contact", "Contact"],
              ["/faq", "FAQ"],
            ].map(([to, label]) => (
              <NavLink key={to} end={to === "/"} to={to}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button"
              aria-label="Search products"
              aria-expanded={search}
              onClick={() => setSearch(!search)}
            >
              <Search size={21} />
            </button>
            <WhatsAppButton
              className="header-whatsapp"
              aria-label="Chat on WhatsApp"
            >
              {null}
            </WhatsAppButton>
            <Link
              className="cart-link"
              to="/cart"
              aria-label={`Quote basket, ${count} items`}
            >
              <ShoppingBag size={21} />
              <span className="cart-count">{count}</span>
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-label={menu ? "Close menu" : "Open menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {search && (
          <form
            className="header-search container"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                "/shop?q=" +
                  encodeURIComponent(new FormData(e.currentTarget).get("q")),
              );
            }}
          >
            <label htmlFor="header-query" className="sr-only">
              Search products
            </label>
            <input
              autoFocus
              id="header-query"
              name="q"
              placeholder="Search solar panels, inverters, batteries…"
            />
            <button className="button green">
              Search <Search size={17} />
            </button>
          </form>
        )}
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer>
        <div className="container footer-grid">
          <div>
            <Logo />
            <p>
              Reliable power. Better living.
              <br />
              Your next step towards a brighter future.
            </p>
            <div className="socials">
              {Object.entries(b.socialLinks)
                .filter(([, url]) => url)
                .map(([name, url]) => {
                  const Icon = {
                    instagram: Instagram,
                    facebook: Facebook,
                    linkedin: Linkedin,
                  }[name];
                  return (
                    <a
                      key={name}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={name}
                    >
                      <Icon size={19} />
                    </a>
                  );
                })}
            </div>
          </div>
          <div>
            <h3>Company</h3>
            <Link to="/">Home</Link>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div>
            <h3>Shop</h3>
            {[
              "Solar Panels",
              "Inverters",
              "Spy Cameras",
              "Solar Security Cameras",
            ].map((c) => (
              <Link key={c} to={"/shop?category=" + encodeURIComponent(c)}>
                {c}
              </Link>
            ))}
          </div>
          <div>
            <h3>Customer support</h3>
            <Link to="/faq">Frequently asked questions</Link>
            <Link to="/contact">Contact us</Link>
            <WhatsAppButton className="footer-wa">
              WhatsApp enquiries
            </WhatsAppButton>
          </div>
          <div>
            <h3>Get in touch</h3>
            {b.phone && <a href={"tel:" + b.phone}>{b.phone}</a>}
            {b.email && <a href={"mailto:" + b.email}>{b.email}</a>}
            <p>{b.address}</p>
            <Link to="/contact">
              Send us a message <ArrowRight size={14} />
            </Link>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>
            © {new Date().getFullYear()} {b.companyName}. All rights reserved.
          </span>
          <span>Powering possibilities, every day.</span>
        </div>
      </footer>
      <WhatsAppButton
        className="floating-wa"
        aria-label="Make an enquiry on WhatsApp"
      >
        {null}
      </WhatsAppButton>
    </>
  );
}
