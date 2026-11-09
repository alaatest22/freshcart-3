import { imageFallback } from "../lib/api";
import { Link } from "react-router-dom";
import useResource from "../hooks/useResource";
import ProductCard from "./ProductCard";
import { ErrorState, Icon, Loading } from "./UI";
export default function Home() {
  const products = useResource("/products?limit=8");
  const categories = useResource("/categories?limit=6");
  return (
    <div className="container home">
      <section className="hero">
        <div className="hero-copy">
          <span className="pill">THE EVERYDAY, UPGRADED</span>
          <h1>
            Fresh finds.
            <br />
            <em>Every single day.</em>
          </h1>
          <p>
            From the little essentials to your next favorite thing. Discover
            more of what you love, all in one place.
          </p>
          <Link className="btn" to="/products">
            Explore the collection <Icon name="arrow" />
          </Link>
          <div className="hero-caption">
            <span>01 /</span> A fresher way to shop
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-circle" />
          <img
            onError={imageFallback}
            src="/images/hero-shopping.png"
            alt="Fresh groceries and everyday essentials"
          />
          <div className="floating-card">
            <span>✦</span>
            <div>
              <strong>Something for everyone</strong>
              <small>Discover your next favorite</small>
            </div>
          </div>
        </div>
      </section>
      <div className="benefits">
        <div>
          <Icon name="bag" />
          <span>
            <strong>Everyday variety</strong>
            <small>Find more of what you love</small>
          </span>
        </div>
        <div>
          <Icon name="heart" />
          <span>
            <strong>Save your favorites</strong>
            <small>Keep your wishlist close</small>
          </span>
        </div>
        <div>
          <Icon name="cart" />
          <span>
            <strong>Simple checkout</strong>
            <small>Online or cash on delivery</small>
          </span>
        </div>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR FAVORITES</p>
            <h2>Shop by category</h2>
          </div>
          <Link to="/categories">View all categories ↗</Link>
        </div>
        {categories.loading ? (
          <Loading />
        ) : categories.error ? (
          <ErrorState message={categories.error} retry={categories.retry} />
        ) : (
          <div className="category-strip">
            {categories.data?.data.map((category) => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
              >
                <div>
                  <img
                    onError={imageFallback}
                    src={category.image}
                    alt=""
                    loading="lazy"
                  />
                </div>
                <h3>{category.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CURATED FOR YOUR EVERYDAY</p>
            <h2>Good things, great finds.</h2>
          </div>
          <Link to="/products">Shop all products ↗</Link>
        </div>
        {products.loading ? (
          <Loading />
        ) : products.error ? (
          <ErrorState message={products.error} retry={products.retry} />
        ) : (
          <div className="product-grid">
            {products.data?.data.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
      <section className="discover-banner">
        <div>
          <p className="eyebrow">YOUR NEXT FAVORITE IS WAITING</p>
          <h2>Meet the brands you’ll love.</h2>
          <p>A world of choice, brought together for you.</p>
        </div>
        <Link className="btn light" to="/brands">
          Explore brands <Icon name="arrow" />
        </Link>
      </section>
    </div>
  );
}
