import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useShop, useNotice } from "../Context/contexts";
import { api, money } from "../lib/api";
import { Empty, ErrorState, Field, Heading, Loading } from "./UI";
export default function Checkout() {
  const shop = useShop();
  const notify = useNotice();
  const navigate = useNavigate();
  const [method, setMethod] = useState("online"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current || !shop.cart?._id) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const shippingAddress = {
      details: values.details.trim(),
      phone: values.phone.trim(),
      city: values.city.trim(),
    };
    if (!shippingAddress.details || !shippingAddress.city) {
      setError("Please enter your address and city.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (method === "cash") {
        await api(`/orders/${shop.cart._id}`, {
          method: "POST",
          body: { shippingAddress },
        });
        shop.orderPlaced();
        notify("Your order was placed. Payment is due on delivery.");
        navigate("/allorders", { replace: true });
      } else {
        const result = await api(
          `/orders/checkout-session/${shop.cart._id}?url=${encodeURIComponent(window.location.origin)}`,
          { method: "POST", body: { shippingAddress } },
        );
        const target = new URL(result.session?.url || "");
        if (
          target.protocol !== "https:" ||
          target.hostname !== "checkout.stripe.com"
        )
          throw new Error(
            "The payment service returned an unexpected checkout address.",
          );
        window.location.assign(target.href);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (shop.loading) return <Loading />;
  if (shop.errors.cart)
    return <ErrorState message={shop.errors.cart} retry={shop.refresh} />;
  if (!shop.cart?.products?.length)
    return <Empty title="Add something to your cart first" />;
  return (
    <div className="container page">
      <Heading
        eyebrow="THE LAST LITTLE STEP"
        title="Checkout."
        text="Your favorites are almost yours."
      />
      <form className="checkout-layout" onSubmit={submit}>
        <section className="checkout-form">
          <h2>01. Delivery details</h2>
          <Field
            label="Address and apartment details"
            name="details"
            required
            minLength={5}
            autoComplete="street-address"
          />
          <div className="two-fields">
            <Field
              label="City"
              name="city"
              required
              minLength={2}
              autoComplete="address-level2"
            />
            <Field
              label="Phone number"
              name="phone"
              type="tel"
              required
              pattern="01[0125][0-9]{8}"
              title="Enter an 11-digit Egyptian mobile number"
              autoComplete="tel"
            />
          </div>
          <h2>02. Payment method</h2>
          <label
            className={`payment-option ${method === "online" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="payment"
              value="online"
              checked={method === "online"}
              onChange={() => setMethod("online")}
              disabled={busy}
            />
            <span>
              <strong>Pay online</strong>
              <small>Continue to the secure hosted payment page.</small>
            </span>
            <span className="payment-mark">CARD</span>
          </label>
          <label
            className={`payment-option ${method === "cash" ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="payment"
              value="cash"
              checked={method === "cash"}
              onChange={() => setMethod("cash")}
              disabled={busy}
            />
            <span>
              <strong>Cash on delivery</strong>
              <small>Place your order now, pay when it arrives.</small>
            </span>
          </label>
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
        </section>
        <aside className="summary">
          <h2>Your order</h2>
          {shop.cart.products.map((item) => (
            <div className="checkout-line" key={item._id}>
              <span>
                {item.product.title} × {item.count}
              </span>
              <strong>{money(item.price * item.count)}</strong>
            </div>
          ))}
          <div className="summary-total">
            <span>Cart total</span>
            <strong>{money(shop.cart.totalCartPrice)}</strong>
          </div>
          <p className="muted">
            The order service determines any additional fees and the final
            payable total.
          </p>
          <button className="btn full" disabled={busy || Boolean(shop.busy)}>
            {busy
              ? "Processing…"
              : method === "online"
                ? "Continue to payment →"
                : "Place cash order →"}
          </button>
          <small>
            {method === "online"
              ? "Payment is confirmed by the server, not by this redirect."
              : "By placing this order, you choose payment on delivery."}
          </small>
        </aside>
      </form>
    </div>
  );
}
