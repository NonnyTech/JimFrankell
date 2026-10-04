import FeedbackForm from "./FeedbackForm.jsx";
import { useEffect, useState } from "react";
import { storeRequest } from "../services/storeService.js";
import { useCatalog } from "../context/CatalogContext.jsx";
export default function ProductReviews({ product }) {
  const { live } = useCatalog();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
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
  return (
    <section className="reviews-section" aria-labelledby="reviews-title">
      <div>
        <p className="eyebrow">YOUR EXPERIENCE MATTERS</p>
        <h2 id="reviews-title">Customer feedback</h2>
        <p>
          Purchases are arranged
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
      {error && <p role="alert">{error}</p>}
      <FeedbackForm product={product} />
    </section>
  );
}
