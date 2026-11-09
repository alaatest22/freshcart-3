import { imageFallback } from "../lib/api";
import { Link } from "react-router-dom";
import { useShop } from "../Context/contexts";
import { money, productId } from "../lib/api";
import { Empty, ErrorState, Heading, Loading } from "./UI";
export default function Cart() {
  const shop = useShop();
  const items = shop.cart?.products || [];
  return (
    <div className="container page">
      <Heading
        eyebrow="YOUR GOOD FINDS"
        title="Shopping cart."
        text={`${shop.cartCount} items, a little closer to yours.`}
      >
        {items.length > 0 && (
          <button
            className="text-button danger"
            disabled={Boolean(shop.busy)}
            onClick={() => {
              if (window.confirm("Remove all items from your cart?"))
                shop.clearCart();
            }}
          >
            Clear cart
          </button>
        )}
      </Heading>
      {shop.loading ? (
        <Loading />
      ) : shop.errors.cart ? (
        <ErrorState message={shop.errors.cart} retry={shop.refresh} />
      ) : !items.length ? (
        <Empty title="Your cart is waiting" />
      ) : (
        <div className="cart-layout">
          <section className="cart-items" aria-label="Cart items">
            {items.map((item) => {
              const product = item.product,
                id = productId(product);
              return (
                <article className="cart-item" key={item._id || id}>
                  <Link to={`/products/${id}`}>
                    <img
                      onError={imageFallback}
                      src={product.imageCover}
                      alt={product.title}
                    />
                  </Link>
                  <div>
                    <p className="category-label">{product.category?.name}</p>
                    <Link to={`/products/${id}`}>
                      <h3>{product.title}</h3>
                    </Link>
                    <p>{money(item.price)} each</p>
                    <button
                      className="text-button danger"
                      disabled={Boolean(shop.busy)}
                      onClick={() => shop.removeFromCart(id)}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="cart-item-end">
                    <strong>{money(item.price * item.count)}</strong>
                    <div className="quantity">
                      <button
                        disabled={Boolean(shop.busy) || item.count <= 1}
                        aria-label={`Decrease quantity of ${product.title}`}
                        onClick={() => shop.updateQuantity(id, item.count - 1)}
                      >
                        −
                      </button>
                      <span aria-live="polite">{item.count}</span>
                      <button
                        disabled={
                          Boolean(shop.busy) ||
                          (Number.isFinite(product.quantity) &&
                            item.count >= product.quantity)
                        }
                        aria-label={`Increase quantity of ${product.title}`}
                        onClick={() => shop.updateQuantity(id, item.count + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            <Link className="continue-link" to="/products">
              ← Continue shopping
            </Link>
          </section>
          <aside className="summary">
            <h2>Order summary</h2>
            <div>
              <span>Items ({shop.cartCount})</span>
              <strong>{money(shop.cart.totalCartPrice)}</strong>
            </div>
            <p className="muted">
              Any delivery fees or taxes will be determined by the order
              service.
            </p>
            <div className="summary-total">
              <span>Cart total</span>
              <strong>{money(shop.cart.totalCartPrice)}</strong>
            </div>
            {shop.busy ? (
              <button className="btn" disabled>
                Updating cart…
              </button>
            ) : (
              <Link className="btn" to="/checkout">
                Proceed to checkout →
              </Link>
            )}
            <small>Choose online payment or cash on delivery.</small>
          </aside>
        </div>
      )}
    </div>
  );
}
