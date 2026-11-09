import { imageFallback } from "../lib/api";
import { useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import useResource from "../hooks/useResource";
import { useAuth, useShop } from "../Context/contexts";
import { money, productId } from "../lib/api";
import { Empty, ErrorState, Icon, Loading } from "./UI";
export default function ProductDetails() {
  const { id } = useParams();
  return <Detail key={id} id={id} />;
}
function Detail({ id }) {
  const resource = useResource(`/products/${id}`);
  const [selected, setSelected] = useState(null);
  const { session } = useAuth();
  const shop = useShop();
  const navigate = useNavigate();
  const location = useLocation();
  if (resource.loading) return <Loading />;
  if (resource.error)
    return <ErrorState message={resource.error} retry={resource.retry} />;
  const product = resource.data?.data;
  if (!product) return <Empty title="Product not found" />;
  const saved = shop.wishlist.some((item) => productId(item) === id);
  const act = (fn) =>
    session ? fn() : navigate("/login", { state: { from: location.pathname } });
  return (
    <div className="container page">
      <p className="breadcrumb">
        <Link to="/products">Products</Link> / {product.category?.name} /{" "}
        {product.title}
      </p>
      <div className="detail-layout">
        <section className="gallery" aria-label="Product images">
          <div className="main-image">
            <img
              onError={imageFallback}
              src={selected || product.imageCover}
              alt={product.title}
            />
          </div>
          <div className="thumbnails">
            {[...new Set([product.imageCover, ...(product.images || [])])].map(
              (src, i) => (
                <button
                  key={src}
                  className={
                    (selected || product.imageCover) === src ? "selected" : ""
                  }
                  onClick={() => setSelected(src)}
                  aria-label={`View product image ${i + 1}`}
                >
                  <img onError={imageFallback} src={src} alt="" />
                </button>
              ),
            )}
          </div>
        </section>
        <section className="detail-copy">
          <p className="eyebrow">
            {product.brand?.name} · {product.category?.name}
          </p>
          <h1>{product.title}</h1>
          <p className="rating">
            <span>★</span> {product.ratingsAverage || "New"}{" "}
            <small>({product.ratingsQuantity || 0} reviews)</small>
          </p>
          <p className="detail-price">
            {money(product.priceAfterDiscount ?? product.price)}{" "}
            {product.priceAfterDiscount && <del>{money(product.price)}</del>}
          </p>
          <p className="stock">
            {product.quantity > 0 ? "● In stock" : "Out of stock"}
          </p>
          <p className="description">{product.description}</p>
          <div className="detail-actions">
            <button
              className="btn"
              disabled={
                Boolean(shop.busy) ||
                (session && shop.loading) ||
                product.quantity === 0
              }
              onClick={() => act(() => shop.addToCart(id))}
            >
              <Icon name="cart" />
              {shop.busy === `cart:${id}` ? "Adding…" : "Add to cart"}
            </button>
            <button
              className="btn secondary"
              disabled={
                Boolean(shop.busy) ||
                (session && (shop.loading || Boolean(shop.errors.wishlist)))
              }
              onClick={() => act(() => shop.toggleWishlist(product))}
            >
              <Icon name="heart" fill={saved ? "currentColor" : "none"} />
              {saved ? "Saved" : "Save for later"}
            </button>
          </div>
          <div className="detail-facts">
            <p>
              Category <strong>{product.category?.name}</strong>
            </p>
            <p>
              Brand <strong>{product.brand?.name}</strong>
            </p>
            <p>
              Payment <strong>Online or cash on delivery</strong>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
