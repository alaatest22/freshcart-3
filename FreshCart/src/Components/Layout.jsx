import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { Icon } from "./UI";
export default function Layout() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <Navbar />
      <main id="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <Link className="logo" to="/">
              <Icon name="cart" />
              freshcart
            </Link>
            <p>
              Everyday essentials. Exceptional finds.
              <br />A fresher way to shop.
            </p>
          </div>
          <div>
            <h3>Discover</h3>
            <Link to="/products">All products</Link>
            <Link to="/categories">Categories</Link>
            <Link to="/brands">Our brands</Link>
          </div>
          <div>
            <h3>Your account</h3>
            <Link to="/wishlist">Wishlist</Link>
            <Link to="/cart">Shopping cart</Link>
            <Link to="/allorders">Your orders</Link>
          </div>
          <div>
            <h3>Made for your everyday</h3>
            <p>Browse, save your favorites, and checkout with confidence.</p>
            <span className="payment-mark">VISA · Mastercard · Cash</span>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© {new Date().getFullYear()} FreshCart · Student project</span>
          <span>Built with care, for your everyday.</span>
        </div>
      </footer>
    </>
  );
}
