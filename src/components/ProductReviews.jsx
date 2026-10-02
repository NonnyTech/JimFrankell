import { useEffect, useState } from "react";
import { storeRequest } from "../services/storeService.js";
import { useCatalog } from "../context/CatalogContext.jsx";
export default function ProductReviews({ product }) {
  const { live } = useCatalog();
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (!live) return;
    const controller = new AbortController();
    storeRequest("reviews", {
      query: { productId: product.id },
      signal: controller.signal,
    })
      .then((result) => setReviews(result.reviews))
      .catch(() => {
        if (!controller.signal.aborted)
          setError("Reviews could not be loaded. Please try again later.");
      });
    return () => controller.abort();
  }, [product.id, live]);
  if (!live) return null;
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      const result = await storeRequest("feedback", {
        method: "POST",
        body: {
          ...values,
          productId: product.id,
          rating: Number(values.rating),
          consent: values.consent === "on",
        },
      });
      setStatus(result.message);
      setSent(true);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div>
        <p className="eyebrow">YOUR EXPERIENCE MATTERS</p>
        <h2 id="reviews-title">Customer feedback</h2>
        <p>
          Feedback is reviewed before publication. Purchases are arranged
          directly with our team.
        </p>
        {!reviews.length && <p>No published reviews yet.</p>}
        {reviews.map((review) => (
          <article className="review" key={review.id}>
            <strong>{review.name}</strong>{" "}
            <span aria-label={`${review.rating} out of 5 stars`}>
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </span>
            <p>{review.message}</p>
            <small>
              {new Date(review.created_at).toLocaleDateString("en-GB", {
                timeZone: "UTC",
              })}
            </small>
          </article>
        ))}
      </div>
      <div className="review-form">
        <h3>Purchased this item? Share your experience.</h3>
        {error && <p role="alert">{error}</p>}
        {status && <p role="status">{status}</p>}
        {!sent && (
          <form onSubmit={submit} className="store-form">
            <label>
              Display name
              <input
                name="name"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </label>
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
              />
            </label>
            <small>
              Your email stays private and is only available to our team.
            </small>
            <label>
              Rating
              <select name="rating" required defaultValue="">
                <option value="" disabled>
                  Choose a rating
                </option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} out of 5
                  </option>
                ))}
              </select>
            </label>
            <label>
              Your feedback
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={3000}
                rows={4}
              />
            </label>
            <div className="review-trap" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <label className="check-label">
              <input type="checkbox" name="consent" required /> I agree that my
              display name, rating and feedback may be published after review,
              and my email stored privately for follow-up.
            </label>
            <button className="button green" disabled={busy}>
              {busy ? "Submitting…" : "Submit feedback"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
