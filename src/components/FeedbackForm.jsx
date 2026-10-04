import { useState } from "react";
import { storeRequest } from "../services/storeService.js";

export default function FeedbackForm({ product, products = [] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError("");
    try {
      const result = await storeRequest("feedback", { method: "POST", body: {
        ...values, productId: product?.id || Number(values.productId),
        rating: Number(values.rating), consent: values.consent === "on",
      } });
      setStatus(result.message);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  return <div className="review-form">
    <h3>{product ? "Purchased this item? Share your experience." : "Share your experience"}</h3>
    {!status && <p>Tell us about your experience with your purchase.</p>}
    {error && <p role="alert">{error}</p>}
    {status ? <p role="status">{status}</p> : <form className="store-form" onSubmit={submit}>
      {!product && <label>Product purchased<select name="productId" required defaultValue="" aria-label="Product purchased"><option value="" disabled>Select your product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}
      <label>Display name<input name="name" required minLength={2} maxLength={80} autoComplete="name" /></label>
      <label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <small>Your email stays private and is only available to our team.</small>
      <label>Rating<select name="rating" required defaultValue="" aria-label="Rating"><option value="" disabled>Choose a rating</option>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} out of 5</option>)}</select></label>
      <label>Your feedback<textarea name="message" required minLength={10} maxLength={3000} rows={4} /></label>
      <div className="review-trap" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <label className="check-label"><input type="checkbox" name="consent" required /> I agree that my display name, rating and feedback may be published, and my email stored privately for follow-up.</label>
      <button className="button green" disabled={busy || (!product && !products.length)}>{busy ? "Submitting…" : "Submit feedback"}</button>
    </form>}
  </div>;
}
