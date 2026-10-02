import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { storeRequest } from "../services/storeService.js";
import {
  productCategories,
  validateProduct,
} from "../../server/catalog-validation.js";
import { useCatalog } from "../context/CatalogContext.jsx";
import { businessConfig } from "../config/businessConfig.js";
import "../styles/admin.css";

const freshProduct = () => ({
  name: "",
  slug: "",
  category: productCategories[0],
  brand: "Jim-Frankell Ltd",
  price: "",
  shortDescription: "",
  description: "",
  warranty: "Please confirm warranty terms before ordering.",
  images: [],
  specifications: {},
  inStock: true,
  featured: false,
  published: false,
});
export default function Admin() {
  const activeUser = useRef(null);
  const loadVersion = useRef(0);
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [setup, setSetup] = useState("Loading admin…");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [offset, setOffset] = useState(0);
  const [editor, setEditor] = useState(null);
  const [specText, setSpecText] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [restricted, setRestricted] = useState(false);
  const { refresh } = useCatalog();
  useEffect(() => {
    let active = true,
      subscription;
    storeRequest("config")
      .then(async (config) => {
        if (!active) return;
        if (!config.configured) {
          setSetup(
            "The database is not connected yet. Follow ADMIN-SETUP.md to configure Supabase and Netlify.",
          );
          return;
        }
        const auth = createClient(config.url, config.key);
        subscription = auth.auth.onAuthStateChange((event, next) => {
          if (!active) return;
          if (activeUser.current !== next?.user.id) {
            setAuthorized(false);
            setRestricted(false);
            loadVersion.current++;
          }
          activeUser.current = next?.user.id;
          setSession(next);
          if (!next) {
            setAuthorized(false);
            setProducts([]);
            setReviews([]);
            setEditor(null);
          }
          if (event === "PASSWORD_RECOVERY") setRecovery(true);
        }).data.subscription;
        setClient(auth);
        const result = await auth.auth.getSession();
        if (active) {
          activeUser.current = result.data.session?.user.id;
          setSession(result.data.session);
          setSetup("");
        }
      })
      .catch(() => {
        if (active)
          setSetup("Admin could not be loaded. Refresh the page to try again.");
      });
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);
  async function api(resource, options = {}) {
    const { data, error: authError } = await client.auth.getSession();
    if (authError || !data.session) throw Error("Please sign in again.");
    return storeRequest(resource, {
      ...options,
      token: data.session.access_token,
    });
  }
  async function load() {
    const version = ++loadVersion.current;
    const identity = activeUser.current;
    setBusy(true);
    setError("");
    try {
      const result = await api(
        tab === "products" ? "admin-products" : "admin-reviews",
        { query: { offset, status: reviewStatus } },
      );
      if (version !== loadVersion.current || identity !== activeUser.current)
        return;
      if (tab === "products") setProducts(result.products);
      else setReviews(result.reviews);
      setAuthorized(true);
      setRestricted(false);
    } catch (failure) {
      if (version === loadVersion.current) {
        setError(failure.message);
        setAuthorized(false);
        setRestricted(failure.status === 403);
      }
    } finally {
      if (version === loadVersion.current) setBusy(false);
    }
  }
  useEffect(() => {
    if (session && client) load();
  }, [session?.user.id, client, tab, offset, reviewStatus]);
  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await client.auth.signInWithPassword({
        email: form.get("email"),
        password: form.get("password"),
      });
      if (result.error)
        throw Error("Sign-in failed. This area is restricted to authorised admins. Check your email and password.");
      setSession(result.data.session);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function reset(event) {
    const form = event.currentTarget.closest("form");
    const email = form.elements.email.value;
    if (!email || !form.elements.email.reportValidity()) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin`,
      });
      if (error)
        throw Error(
          "A reset email could not be requested. Please try again later.",
        );
      setMessage(
        "If this address is registered, you will receive a password reset email.",
      );
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function password(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await client.auth.updateUser({
        password: new FormData(event.currentTarget).get("password"),
      });
      if (error)
        throw Error(
          "Password could not be updated. Use a stronger password or request a new reset link.",
        );
      setRecovery(false);
      setMessage("Password updated.");
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function edit(product) {
    setEditor({ ...product, price: product.price ?? "" });
    setSpecText(
      Object.entries(product.specifications || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n"),
    );
    setError("");
    setMessage("");
  }
  function field(key, value) {
    setEditor((current) => ({ ...current, [key]: value }));
  }
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const specifications = Object.fromEntries(
        specText
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const index = line.indexOf(":");
            if (index < 1)
              throw Error("Use one specification per line: Name: Value");
            return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
          }),
      );
      const product = validateProduct({
        ...editor,
        specifications,
        price: editor.price === "" ? null : Number(editor.price),
      });
      await api("admin-products", {
        method: editor.id ? "PATCH" : "POST",
        body: { ...product, id: editor.id, updatedAt: editor.updatedAt },
      });
      setEditor(null);
      setMessage(
        product.published
          ? "Product saved and published."
          : "Draft saved. It is hidden from customers.",
      );
      await load();
      await refresh();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(event) {
    const files = [...event.target.files];
    event.target.value = "";
    if (editor.images.length + files.length > 8) {
      setError("A product can have up to eight photos.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      for (const file of files) {
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 3 * 1024 * 1024
        )
          throw Error(
            "Choose JPEG, PNG or WebP photos smaller than 3 MB each.",
          );
        const encoded = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const { url } = await api("upload", {
          method: "POST",
          body: { image: encoded },
        });
        setEditor((current) => ({
          ...current,
          images: [...current.images, url],
        }));
      }
    } catch (failure) {
      setError(failure.message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function moderate(id, status) {
    setBusy(true);
    setError("");
    try {
      await api("moderate", { method: "PATCH", body: { id, status } });
      setMessage(`Review ${status}.`);
      await load();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link to="/" className="logo">
          <img src={businessConfig.logo} alt="JF" />
          <span>
            Jim-Frankell <small>STORE ADMIN</small>
          </span>
        </Link>
        <Link to="/shop">View store ↗</Link>
        {session && (
          <button
            disabled={busy}
            onClick={async () => {
              const { error } = await client.auth.signOut();
              if (error) setError("Sign-out failed. Please try again.");
            }}
          >
            Sign out
          </button>
        )}
      </header>
      {setup ? (
        <section className="admin-panel">
          <h1>Store administration</h1>
          <p role="status">{setup}</p>
        </section>
      ) : (
        <>
          {error && (
            <div className="admin-notice error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="admin-notice" role="status">
              {message}
            </div>
          )}
          {recovery ? (
            <form
              className="admin-panel store-form admin-login"
              onSubmit={password}
            >
              <h1>Set a new password</h1>
              <label>
                New password
                <input
                  type="password"
                  name="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </label>
              <button className="button green" disabled={busy}>
                Update password
              </button>
            </form>
          ) : !session ? (
            <form
              className="admin-panel store-form admin-login"
              onSubmit={login}
            >
              <p className="eyebrow">WELCOME BACK</p>
              <h1>Manage your store</h1>
              <p>Sign in with your authorised admin account.</p>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </label>
              <button className="button green" disabled={busy}>
                {busy ? "Please wait…" : "Sign in"}
              </button>
              <button type="button" onClick={reset} disabled={busy}>
                Forgot password?
              </button>
            </form>
          ) : restricted ? (
            <section className="admin-panel admin-login">
              <h1>Admin access only</h1>
              <p>Your account is signed in, but it is not authorised to manage this store. Sign out and use an administrator account, or contact the store owner for access.</p>
              <Link to="/shop" className="button green">Return to shop</Link>
            </section>
          ) : (
            <>
              <div className="admin-title">
                <div>
                  <p className="eyebrow">YOUR BUSINESS, IN ONE PLACE</p>
                  <h1>Store dashboard</h1>
                </div>
                {authorized && (
                  <button
                    className="button green"
                    disabled={busy}
                    onClick={() => {
                      setTab("products");
                      edit(freshProduct());
                    }}
                  >
                    + Add product
                  </button>
                )}
              </div>
              <nav className="admin-tabs" aria-label="Admin sections">
                <button
                  aria-pressed={tab === "products"}
                  disabled={busy || !!editor}
                  onClick={() => {
                    setTab("products");
                    setOffset(0);
                  }}
                >
                  Products
                </button>
                <button
                  aria-pressed={tab === "reviews"}
                  disabled={busy || !!editor}
                  onClick={() => {
                    setTab("reviews");
                    setOffset(0);
                  }}
                >
                  Customer feedback
                </button>
                <button disabled={busy || !!editor} onClick={load}>
                  Refresh
                </button>
              </nav>
              {busy && <p role="status">Working…</p>}
              {editor && authorized ? (
                <form onSubmit={save} className="admin-panel store-form">
                  <div className="admin-editor-heading">
                    <button
                      type="button"
                      className="admin-back"
                      disabled={busy}
                      onClick={() => { setEditor(null); setError(""); }}
                    >
                      <span aria-hidden="true">←</span> Back to products
                    </button>
                    <h2>{editor.id ? "Edit product" : "New product"}</h2>
                    <small>Save your changes before going back.</small>
                  </div>
                  <div className="admin-fields">
                    <label>
                      Product name
                      <input
                        required
                        maxLength={120}
                        value={editor.name}
                        onChange={(e) => field("name", e.target.value)}
                      />
                    </label>
                    <label>
                      Product URL slug
                      <input
                        required
                        disabled={!!editor.id}
                        pattern="[a-z0-9]+(-[a-z0-9]+)*"
                        placeholder="e.g. jf-5kva-inverter"
                        value={editor.slug}
                        onChange={(e) => field("slug", e.target.value)}
                      />
                    </label>
                    <label>
                      Category
                      <select
                        value={editor.category}
                        onChange={(e) => field("category", e.target.value)}
                      >
                        {productCategories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Brand
                      <input
                        required
                        value={editor.brand}
                        maxLength={100}
                        onChange={(e) => field("brand", e.target.value)}
                      />
                    </label>
                    <label>
                      Price (NGN)
                      <input
                        type="number"
                        min="0.01"
                        max="1000000000"
                        step="0.01"
                        value={editor.price}
                        onChange={(e) => field("price", e.target.value)}
                      />
                      <small>Leave blank for “Price on request”.</small>
                    </label>
                  </div>
                  <label>
                    Short description
                    <textarea
                      required
                      minLength={5}
                      maxLength={240}
                      value={editor.shortDescription}
                      onChange={(e) =>
                        field("shortDescription", e.target.value)
                      }
                    />
                  </label>
                  <label>
                    Full description
                    <textarea
                      required
                      minLength={10}
                      maxLength={10000}
                      rows={5}
                      value={editor.description}
                      onChange={(e) => field("description", e.target.value)}
                    />
                  </label>
                  <label>
                    Specifications
                    <textarea
                      rows={4}
                      placeholder="Capacity: 5 kVA"
                      value={specText}
                      onChange={(e) => setSpecText(e.target.value)}
                    />
                    <small>
                      One per line: Name: Value. Only include confirmed
                      specifications.
                    </small>
                  </label>
                  <label>
                    Warranty
                    <textarea
                      required
                      minLength={5}
                      maxLength={1000}
                      value={editor.warranty}
                      onChange={(e) => field("warranty", e.target.value)}
                    />
                  </label>
                  <label>
                    Product photos
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={busy}
                      onChange={upload}
                    />
                    <small>
                      Up to 8 photos; 3 MB each. The first photo is the main
                      image.
                    </small>
                  </label>
                  <div className="admin-photos">
                    {editor.images.map((url, i) => (
                      <div key={url}>
                        <img src={url} alt={`Product photo ${i + 1}`} />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            field(
                              "images",
                              editor.images.filter((_, n) => n !== i),
                            )
                          }
                        >
                          Remove photo {i + 1}
                        </button>
                        {i > 0 && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              field("images", [
                                url,
                                ...editor.images.filter((_, n) => n !== i),
                              ])
                            }
                          >
                            Make main photo
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={editor.inStock}
                      onChange={(e) => field("inStock", e.target.checked)}
                    />{" "}
                    Available for enquiries
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={editor.featured}
                      onChange={(e) => field("featured", e.target.checked)}
                    />{" "}
                    Feature on homepage
                  </label>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={editor.published}
                      onChange={(e) => field("published", e.target.checked)}
                    />{" "}
                    Publish in the store
                  </label>
                  <div className="admin-actions">
                    <button className="button green" disabled={busy}>
                      {busy ? "Please wait…" : "Save product"}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setEditor(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                authorized &&
                (tab === "products" ? (
                  <section className="admin-panel">
                    <h2>Products</h2>
                    <p>
                      Unpublish a product to hide it while retaining its
                      feedback and history.
                    </p>
                    <div className="admin-products">
                      {products.map((p) => (
                        <article key={p.id}>
                          <img src={p.images[0]} alt="" />
                          <div>
                            <strong>{p.name}</strong>
                            <p>
                              {p.published ? "Published" : "Draft"} ·{" "}
                              {p.price == null
                                ? "Price on request"
                                : `NGN ${p.price.toLocaleString()}`}
                            </p>
                          </div>
                          <button
                            className="button outline"
                            disabled={busy}
                            onClick={() => edit(p)}
                          >
                            Edit
                          </button>
                        </article>
                      ))}
                    </div>
                    {!products.length && (
                      <p>
                        No products on this page. Add a product or import the
                        existing catalog using ADMIN-SETUP.md.
                      </p>
                    )}
                  </section>
                ) : (
                  <section className="admin-panel">
                    <h2>Customer feedback</h2>
                    <label>
                      Review status{" "}
                      <select
                        value={reviewStatus}
                        disabled={busy}
                        onChange={(e) => {
                          setReviewStatus(e.target.value);
                          setOffset(0);
                        }}
                      >
                        <option value="pending">Pending approval</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>
                    {!reviews.length && (
                      <p>No {reviewStatus} reviews on this page.</p>
                    )}
                    {reviews.map((r) => (
                      <article className="admin-review" key={r.id}>
                        <h3>{r.store_products?.data?.name || "Product"}</h3>
                        <strong>
                          {r.name} · {r.rating}/5
                        </strong>
                        <p>{r.message}</p>
                        <small>
                          {r.email} · {new Date(r.created_at).toLocaleString()}
                        </small>
                        <div className="admin-actions">
                          {["approved", "rejected", "pending"]
                            .filter((status) => status !== r.status)
                            .map((status) => (
                              <button
                                key={status}
                                disabled={busy}
                                onClick={() => moderate(r.id, status)}
                              >
                                {status === "approved"
                                  ? "Approve"
                                  : status === "rejected"
                                    ? "Reject"
                                    : "Return to pending"}
                              </button>
                            ))}
                        </div>
                      </article>
                    ))}
                  </section>
                ))
              )}
              {authorized && !editor && (
                <div className="admin-actions">
                  <button
                    disabled={busy || offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - 100))}
                  >
                    Previous page
                  </button>
                  <span>Page {offset / 100 + 1}</span>
                  <button
                    disabled={
                      busy ||
                      (tab === "products" ? products : reviews).length < 100
                    }
                    onClick={() => setOffset(offset + 100)}
                  >
                    Next page
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
