import { useCallback, useEffect, useRef, useState } from "react";
import {
  AuthContext,
  ShopContext,
  NoticeContext,
  useAuth,
  useNotice,
} from "./contexts";
import { api, decodeToken, productId, TOKEN_KEY } from "../lib/api";

function initialSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const decoded = decodeToken(token || "");
  if (
    !token ||
    !decoded?.id ||
    !decoded.exp ||
    decoded.exp * 1000 <= Date.now()
  )
    return null;
  return {
    token,
    user: { _id: decoded.id, name: decoded.name || "My account" },
  };
}
export default function Providers({ children }) {
  const [session, setSession] = useState(initialSession);
  const [notice, setNotice] = useState(null);
  const timer = useRef();
  const notify = useCallback((message, type = "success") => {
    clearTimeout(timer.current);
    setNotice({ message, type });
    timer.current = setTimeout(() => setNotice(null), 5000);
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setSession(null);
  }, []);
  useEffect(() => {
    const expired = () => {
      logout();
      notify("Your session expired. Please sign in again.", "error");
    };
    const sync = (event) => {
      if (event.key === TOKEN_KEY) setSession(initialSession());
    };
    window.addEventListener("freshcart:unauthorized", expired);
    window.addEventListener("storage", sync);
    const expiration = session
      ? setInterval(() => {
          if (decodeToken(session.token).exp * 1000 <= Date.now()) expired();
        }, 30000)
      : null;
    return () => {
      window.removeEventListener("freshcart:unauthorized", expired);
      window.removeEventListener("storage", sync);
      clearInterval(expiration);
    };
  }, [logout, notify, session]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const login = (data) => {
    if (!data.token)
      throw new Error("The server did not return a sign-in token.");
    localStorage.setItem(TOKEN_KEY, data.token);
    const decoded = decodeToken(data.token);
    setSession({
      token: data.token,
      user: { ...data.user, _id: data.user?._id || decoded?.id },
    });
  };
  return (
    <AuthContext.Provider
      value={{ session, user: session?.user, login, logout }}
    >
      <NoticeContext.Provider value={notify}>
        <ShopProvider key={session?.token || "guest"}>{children}</ShopProvider>
        {notice && (
          <div
            className={`toast ${notice.type}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            <span>{notice.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}
      </NoticeContext.Provider>
    </AuthContext.Provider>
  );
}
function ShopProvider({ children }) {
  const { session } = useAuth();
  const notify = useNotice();
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(Boolean(session));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState("");
  const lock = useRef(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    Promise.allSettled([
      api("/cart", { signal: controller.signal }),
      api("/wishlist", { signal: controller.signal }),
    ]).then(([cartResult, wishResult]) => {
      if (controller.signal.aborted) return;
      const nextErrors = {};
      if (cartResult.status === "fulfilled") setCart(cartResult.value.data);
      else if (
        cartResult.reason.status === 404 &&
        /no cart/i.test(cartResult.reason.message)
      )
        setCart(null);
      else nextErrors.cart = cartResult.reason.message;
      if (wishResult.status === "fulfilled")
        setWishlist(wishResult.value.data || []);
      else nextErrors.wishlist = wishResult.reason.message;
      setErrors(nextErrors);
      setLoading(false);
    });
    return () => controller.abort();
  }, [session, revision]);
  async function mutate(key, action, message) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(key);
    try {
      await action();
      if (message) notify(message);
      return true;
    } catch (error) {
      notify(error.message, "error");
      return false;
    } finally {
      lock.current = false;
      setBusy("");
    }
  }
  const addToCart = (id) =>
    mutate(
      `cart:${id}`,
      async () => {
        const result = await api("/cart", {
          method: "POST",
          body: { productId: id },
        });
        setCart(result.data);
        setErrors((old) => ({ ...old, cart: "" }));
      },
      "Added to your cart",
    );
  const updateQuantity = (id, count) =>
    mutate(`cart:${id}`, async () => {
      const result = await api(`/cart/${id}`, {
        method: "PUT",
        body: { count },
      });
      setCart(result.data);
    });
  const removeFromCart = (id) =>
    mutate(
      `cart:${id}`,
      async () => {
        const result = await api(`/cart/${id}`, { method: "DELETE" });
        setCart(result.data);
      },
      "Item removed",
    );
  const clearCart = () =>
    mutate(
      "clear",
      async () => {
        await api("/cart", { method: "DELETE" });
        setCart(null);
      },
      "Cart cleared",
    );
  const toggleWishlist = (product) => {
    const id = productId(product),
      saved = wishlist.some((item) => productId(item) === id);
    return mutate(
      `wish:${id}`,
      async () => {
        await api(saved ? `/wishlist/${id}` : "/wishlist", {
          method: saved ? "DELETE" : "POST",
          body: saved ? undefined : { productId: id },
        });
        setWishlist((old) =>
          saved
            ? old.filter((item) => productId(item) !== id)
            : [...old, product],
        );
        setErrors((old) => ({ ...old, wishlist: "" }));
      },
      saved ? "Removed from wishlist" : "Saved to your wishlist",
    );
  };
  return (
    <ShopContext.Provider
      value={{
        cart,
        wishlist,
        loading,
        errors,
        busy,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        cartCount:
          cart?.products?.reduce((sum, item) => sum + item.count, 0) || 0,
        refresh: () => {
          setLoading(true);
          setRevision((n) => n + 1);
        },
        orderPlaced: () => setCart(null),
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}
