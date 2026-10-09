import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCustomer } from "../context/CustomerContext.jsx";
import { storeRequest } from "../services/storeService.js";
import { formatCurrency as money } from "../utils/currency.js";
import "../styles/orders.css";
export default function Account() {
  const navigate = useNavigate();
  const {
    client,
    session,
    loading,
    error: setupError,
    token,
    recovery,
    setRecovery,
  } = useCustomer();
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState([]);
  const [owner, setOwner] = useState(null);
  const [offset, setOffset] = useState(0);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setOrders([]);
    setOwner(null);
    if (!session || recovery) return;
    setBusy(true);
    setError("");
    token()
      .then((t) => storeRequest("my-orders", { token: t, query: { offset } }))
      .then((result) => {
        if (active) {
          setOrders(result.orders);
          setOwner(session.user.id);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [session?.user.id, offset, reload, recovery]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      if (recovery) {
        const result = await client.auth.updateUser({
          password: form.get("password"),
        });
        if (result.error) throw result.error;
        setRecovery(false);
        setNotice("Password updated.");
      } else if (mode === "reset") {
        const result = await client.auth.resetPasswordForEmail(
          form.get("email"),
          { redirectTo: `${location.origin}/account` },
        );
        if (result.error)
          throw Error("Reset email could not be sent. Please try again later.");
        setNotice(
          "If this email is registered, a password reset link will be sent.",
        );
      } else {
        const credentials = {
          email: form.get("email"),
          password: form.get("password"),
        };
        const result =
          mode === "signup"
            ? await client.auth.signUp(credentials)
            : await client.auth.signInWithPassword(credentials);
        if (result.error)
          throw Error(
            mode === "signup"
              ? "Registration failed. Try another email or sign in if you already have an account."
              : "Sign-in failed. Check your email and password.",
          );
        if (!result.data.session)
          setNotice(
            "Your account needs email confirmation under the current store settings. Check your email before signing in.",
          );
        else navigate("/", { replace: true });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="container section account-page">
      <h1>My account</h1>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <p>Loading account…</p>
      ) : setupError ? (
        <p role="alert">{setupError}</p>
      ) : !session || recovery ? (
        <>
          <h2>
            {recovery
              ? "Choose a new password"
              : mode === "signup"
                ? "Create an account"
                : mode === "reset"
                  ? "Reset password"
                  : "Sign in"}
          </h2>
          <form className="order-checkout-form account-form" onSubmit={submit}>
            <fieldset disabled={busy}>
              {!recovery && (
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                  />
                </label>
              )}
              {(recovery || mode !== "reset") && (
                <label>
                  Password
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={mode === "signup" || recovery ? 8 : 1}
                    maxLength={128}
                    autoComplete={
                      mode === "signup" || recovery
                        ? "new-password"
                        : "current-password"
                    }
                  />
                </label>
              )}
              {(mode === "signup" || recovery) && (
                <small>Use at least 8 characters.</small>
              )}
              <button className="button green">
                {busy
                  ? "Please wait…"
                  : recovery
                    ? "Update password"
                    : mode === "signup"
                      ? "Create account"
                      : mode === "reset"
                        ? "Send reset link"
                        : "Sign in"}
              </button>
            </fieldset>
          </form>
          {!recovery && (
            <div className="account-actions">
              {[
                ["login", "Sign in"],
                ["signup", "Create account"],
                ["reset", "Forgot password?"],
              ]
                .filter(([value]) => value !== mode)
                .map(([value, label]) => (
                  <button
                    key={value}
                    disabled={busy}
                    onClick={() => {
                      setMode(value);
                      setError("");
                      setNotice("");
                    }}
                  >
                    {label}
                  </button>
                ))}
            </div>
          )}
          <p>
            <Link to="/cart">Continue as a guest</Link>
          </p>
        </>
      ) : (
        <>
          <p>Hello, {session.user.email}</p>
          <div className="account-actions">
            <Link to="/cart" className="button green">
              My basket
            </Link>
            <button
              disabled={busy}
              onClick={async () => {
                const result = await client.auth.signOut();
                if (result.error)
                  setError("Could not sign out. Please try again.");
                else {
                  setOrders([]);
                  setOffset(0);
                  setNotice("");
                }
              }}
            >
              Sign out
            </button>
          </div>
          <h2>My orders</h2>
          <p>
            Orders placed while signed in appear here. Earlier guest orders are
            not linked automatically.
          </p>
          <button disabled={busy} onClick={() => setReload((n) => n + 1)}>
            Refresh orders
          </button>
          {busy && <p>Loading orders…</p>}
          {!busy && !error && owner === session.user.id && !orders.length && (
            <p>
              No orders yet. <Link to="/shop">Start shopping</Link>
            </p>
          )}
          {owner === session.user.id &&
            orders.map((order) => (
              <article className="admin-order" key={order.reference}>
                <h3>{order.reference}</h3>
                <p>
                  <strong>{order.status}</strong> ·{" "}
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
                <ul className="admin-order-items">
                  {order.items.map((item) => (
                    <li key={`${item.productId}:${item.kva}`}>
                      <img src={item.image} alt="" />
                      <div>
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                        <p>
                          {item.quantity} × {money(item.price)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p>
                  Product total: <strong>{money(order.total)}</strong>
                </p>
              </article>
            ))}
          <div className="account-actions">
            <button
              disabled={busy || !offset}
              onClick={() => setOffset((n) => Math.max(0, n - 20))}
            >
              Previous orders
            </button>
            <button
              disabled={busy || orders.length < 20}
              onClick={() => setOffset((n) => n + 20)}
            >
              Next orders
            </button>
          </div>
        </>
      )}
    </section>
  );
}
