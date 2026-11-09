import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth, useShop } from "../Context/contexts";
import { Icon } from "./UI";
export default function Navbar() {
  const { session, logout } = useAuth();
  const { cartCount, wishlist } = useShop();
  const navigate = useNavigate();
  return (
    <>
      <div className="topbar">
        <div className="container">
          A little fresh. A lot to discover.
          <span>Everyday essentials, all in one place</span>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <Link className="logo" to="/" aria-label="FreshCart home">
            <Icon name="cart" />
            <span>
              fresh<span>cart</span>
            </span>
          </Link>
          <form
            className="searchbar"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              const term = new FormData(event.currentTarget).get("search");
              navigate(`/products?keyword=${encodeURIComponent(term)}`);
            }}
          >
            <input
              name="search"
              aria-label="Search products"
              placeholder="Search for your everyday favorites…"
            />
            <button aria-label="Search">
              <Icon name="search" />
            </button>
          </form>
          <div className="header-actions">
            <NavLink
              to="/wishlist"
              aria-label={`Wishlist, ${wishlist.length} items`}
            >
              <Icon name="heart" />
              <span className="badge">{wishlist.length}</span>
            </NavLink>
            <NavLink to="/cart" aria-label={`Cart, ${cartCount} items`}>
              <Icon name="cart" />
              <span className="badge">{cartCount}</span>
            </NavLink>
            {session ? (
              <button
                className="text-button"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Sign out
              </button>
            ) : (
              <Link className="account" to="/login">
                <Icon name="user" />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </div>
        <nav className="container navigation" aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/products">Products</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <NavLink to="/brands">Brands</NavLink>
          {session && (
            <>
              <NavLink to="/allorders">My orders</NavLink>
              <NavLink to="/account">Account</NavLink>
            </>
          )}
          <span className="nav-note">Good finds. Great prices.</span>
        </nav>
      </header>
    </>
  );
}
