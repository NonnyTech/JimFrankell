import { useEffect, useRef, useState } from "react";
import { storeRequest } from "../services/storeService.js";
export function useCloudCart(customer) {
  const id = customer.session?.user.id;
  const identity = useRef(id);
  identity.current = id;
  const [state, setState] = useState({ owner: null, items: [], revision: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const generation = useRef(0);
  async function load() {
    if (!id || lock.current) return;
    const current = ++generation.current;
    setBusy(true);
    setError("");
    try {
      const token = await customer.token();
      if (identity.current !== id) return;
      const result = await storeRequest("my-cart", { token });
      if (current === generation.current && identity.current === id)
        setState({ owner: id, ...result.cart });
    } catch (e) {
      if (current === generation.current && identity.current === id)
        setError(e.message);
    } finally {
      if (current === generation.current) setBusy(false);
    }
  }
  useEffect(() => {
    setState({ owner: null, items: [], revision: 0 });
    setError("");
    lock.current = false;
    load();
    return () => {
      generation.current++;
    };
  }, [id]);
  async function change(update) {
    if (lock.current || busy || state.owner !== id || error) return;
    const current = ++generation.current;
    const items = typeof update === "function" ? update(state.items) : update;
    lock.current = true;
    setBusy(true);
    try {
      const token = await customer.token();
      if (identity.current !== id) return;
      const result = await storeRequest("my-cart", {
        method: "PUT",
        token,
        body: { items, revision: state.revision },
      });
      if (current === generation.current && identity.current === id)
        setState({ owner: id, ...result.cart });
    } catch (e) {
      if (current === generation.current && identity.current === id)
        setError(e.message);
    } finally {
      if (current === generation.current) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  return {
    items: state.owner === id ? state.items : [],
    change,
    reload: load,
    error,
    busy: !!id && (busy || state.owner !== id),
  };
}
