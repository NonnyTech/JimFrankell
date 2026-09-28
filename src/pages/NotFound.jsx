import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <section className="container empty not-found">
      <p className="eyebrow">A SMALL DETOUR</p>
      <strong className="error-code">404</strong>
      <h1>This page isn’t connected.</h1>
      <p>The page or product you’re looking for could not be found.</p>
      <Link to="/shop" className="button green">
        Explore the shop
      </Link>
    </section>
  );
}
