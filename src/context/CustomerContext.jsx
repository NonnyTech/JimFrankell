import { createContext, useContext, useEffect, useState } from "react";
import { storeRequest } from "../services/storeService.js";
const Context = createContext({ session: null, loading: true });
export const useCustomer = () => useContext(Context);
export function CustomerProvider({ children }) {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    let active = true,
      subscription,
      auth;
    storeRequest("config")
      .then(async (config) => {
        if (!active) return;
        if (!config.configured) {
          setError("Customer accounts are not available yet.");
          return;
        }
        const { createClient } = await import("@supabase/supabase-js");
        if (!active) return;
        auth = createClient(config.url, config.key, {
          auth: { storageKey: "jf-customer-auth" },
        });
        subscription = auth.auth.onAuthStateChange((event, next) => {
          if (!active) return;
          setSession(next);
          if (event === "PASSWORD_RECOVERY") setRecovery(true);
        }).data.subscription;
        setClient(auth);
        const result = await auth.auth.getSession();
        if (active) setSession(result.data.session);
      })
      .catch(() => {
        if (active)
          setError("Accounts could not be loaded. Refresh to try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      subscription?.unsubscribe();
      auth?.auth.stopAutoRefresh();
    };
  }, []);
  async function token() {
    const result = await client?.auth.getSession();
    if (
      !result?.data.session ||
      result.data.session.user.id !== session?.user.id
    )
      throw Error("Your account changed. Please try again.");
    return result.data.session.access_token;
  }
  return (
    <Context.Provider
      value={{ client, session, loading, error, token, recovery, setRecovery }}
    >
      {children}
    </Context.Provider>
  );
}
