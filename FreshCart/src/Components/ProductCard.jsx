import { imageFallback } from "../lib/api";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth, useShop } from "../Context/contexts";
import { money, productId } from "../lib/api";
import { Icon } from "./UI";
export default function ProductCard({ product }) {
  const { session } = useAuth();
  const shop = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  const id = productId(product),
    saved = shop.wishlist.some((p) => productId(p) === id);
  const act = (action) =>
    session
      ? action()
      : navigate("/login", {
          state: { from: location.pathname + location.search },
        });
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={`/products/${id}`}>
          <img
            onError={imageFallback}
            src={product.imageCover}
            alt={product.title}
            loading="lazy"
          />
        </Link>
        {product.priceAfterDiscount && (
          <span className="sale">
            -
            {Math.round((1 - product.priceAfterDiscount / product.price) * 100)}
            %
          </span>
        )}
        <button
          className={`heart ${saved ? "saved" : ""}`}
          aria-label={`${saved ? "Remove" : "Save"} ${product.title} ${saved ? "from" : "to"} wishlist`}
          aria-pressed={saved}
          disabled={
            Boolean(shop.busy) ||
            (session && (shop.loading || Boolean(shop.errors.wishlist)))
          }
          onClick={() => act(() => shop.toggleWishlist(product))}
        >
          <Icon name="heart" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="product-info">
        <p className="category-label">{product.category?.name}</p>
        <Link to={`/products/${id}`}>
          <h3>{product.title}</h3>
        </Link>
        <p className="rating">
          <span>★</span> {product.ratingsAverage || "New"}{" "}
          <small>({product.ratingsQuantity || 0})</small>
        </p>
        <div className="price-row">
          <strong>{money(product.priceAfterDiscount ?? product.price)}</strong>
          {product.priceAfterDiscount && <del>{money(product.price)}</del>}
        </div>
        <button
          className="btn add-btn"
          disabled={
            Boolean(shop.busy) ||
            (session && shop.loading) ||
            product.quantity === 0
          }
          onClick={() => act(() => shop.addToCart(id))}
        >
          <Icon name="cart" />
          {shop.busy === `cart:${id}`
            ? "Adding…"
            : product.quantity === 0
              ? "Out of stock"
              : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
