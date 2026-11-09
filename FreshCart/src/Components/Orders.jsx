import { imageFallback } from "../lib/api";
import { Link } from "react-router-dom";
import { useAuth } from "../Context/contexts";
import useResource from "../hooks/useResource";
import { money } from "../lib/api";
import { Empty, ErrorState, Heading, Loading } from "./UI";
export default function Orders() {
  const { user } = useAuth();
  const orders = useResource(user?._id ? `/orders/user/${user._id}` : null);
  return (
    <div className="container page">
      <Heading
        eyebrow="YOUR PURCHASES"
        title="Your orders."
        text="Payment and delivery status come directly from the order service."
      >
        <button className="btn secondary" onClick={orders.retry}>
          Refresh status
        </button>
      </Heading>
      {orders.loading ? (
        <Loading />
      ) : orders.error ? (
        <ErrorState message={orders.error} retry={orders.retry} />
      ) : orders.data?.length ? (
        <div className="orders">
          {[...orders.data].reverse().map((order) => (
            <article className="order" key={order._id}>
              <header>
                <div>
                  <h2>Order #{order.id || order._id.slice(-8)}</h2>
                  <p className="muted">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="order-status">
                  <span>{order.isPaid ? "Paid" : "Awaiting payment"}</span>
                  <span>
                    {order.isDelivered ? "Delivered" : "Not delivered yet"}
                  </span>
                </div>
              </header>
              <p>
                {order.paymentMethodType === "cash"
                  ? "Cash on delivery"
                  : "Online payment"}{" "}
                · <strong>{money(order.totalOrderPrice)}</strong>
              </p>
              <div className="order-products">
                {order.cartItems?.map((item) => (
                  <Link key={item._id} to={`/products/${item.product?._id}`}>
                    <img
                      onError={imageFallback}
                      src={item.product?.imageCover}
                      alt=""
                    />
                    <span>
                      {item.product?.title}
                      <small>Quantity: {item.count}</small>
                    </span>
                    <strong>{money(item.price * item.count)}</strong>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No orders yet"
          text="If you just returned from payment, allow a moment and refresh the status. We only show confirmed server records."
        />
      )}
    </div>
  );
}
