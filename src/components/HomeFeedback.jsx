import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../context/CatalogContext.jsx";
import { storeRequest } from "../services/storeService.js";
import FeedbackForm from "./FeedbackForm.jsx";
import "../styles/home-feedback.css";

export default function HomeFeedback() {
  const { products, live } = useCatalog();
  const [reviews, setReviews] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setReduced(preference.matches);
    const visibility = () => setHidden(document.hidden);
    motion(); visibility();
    preference.addEventListener("change", motion);
    document.addEventListener("visibilitychange", visibility);
    return () => { preference.removeEventListener("change", motion); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    storeRequest("home-reviews", { signal: controller.signal })
      .then(result => { setReviews(result.reviews); setIndex(0); })
      .catch(() => { if (!controller.signal.aborted) setError("Feedback could not be loaded. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [live, retry]);
  useEffect(() => {
    if (reviews.length < 2 || paused || hover || focused || reduced || hidden) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % reviews.length), 7000);
    return () => clearInterval(timer);
  }, [reviews.length, paused, hover, focused, reduced, hidden]);
  const review = reviews[index];
  const move = (step) => { setPaused(true); setIndex(i => (i + step + reviews.length) % reviews.length); };
  return <section className="home-feedback section" id="customer-feedback" aria-labelledby="home-feedback-title">
    <div className="container">
      <p className="eyebrow">FROM OUR CUSTOMERS</p><h2 id="home-feedback-title">Your experience. In your words.</h2>
      <p>Explore customer feedback, or tell us about a product you purchased.</p>
      <div className="home-feedback-grid">
        <div className="feedback-carousel" role="region" aria-roledescription="carousel" aria-label="Customer feedback"
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
          {loading && <p role="status">Loading customer feedback…</p>}
          {error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Retry feedback</button></p>}
          {!loading && !error && !review && <div className="feedback-empty"><h3>No reviews yet.</h3><p>Share your experience with us.</p></div>}
          {review && <article className="feedback-slide" key={review.id} aria-roledescription="slide" aria-label={`${index + 1} of ${reviews.length}`}>
            <span className="feedback-stars" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
            <blockquote>{review.message}</blockquote>
            <div className="feedback-person"><span className="feedback-avatar" aria-hidden="true">{review.name.slice(0, 1).toUpperCase()}</span><div><strong>{review.name}</strong><Link to={`/product/${review.productSlug}`}>{review.productName}</Link></div></div>
            <small>{new Date(review.created_at).toLocaleDateString("en-GB", { timeZone: "UTC" })}</small>
          </article>}
          {reviews.length > 1 && <div className="feedback-controls">
            <button onClick={() => move(-1)} aria-label="Previous feedback">←</button>
            <span>{index + 1} / {reviews.length}</span>
            <button onClick={() => move(1)} aria-label="Next feedback">→</button>
            {!reduced && <button onClick={() => setPaused(p => !p)}>{paused ? "Play feedback" : "Pause feedback"}</button>}
          </div>}
        </div>
        {live ? <FeedbackForm products={products} /> : <div className="review-form"><h3>Share your experience</h3><p>Online feedback is not available yet. Please <Link to="/contact">contact our team</Link> to share your feedback.</p></div>}
      </div>
    </div>
  </section>;
}
