import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useRouteError,
  Link,
} from "react-router-dom";
import Providers from "./Context/Providers";
import { useAuth } from "./Context/contexts";
import Layout from "./Components/Layout";
import Home from "./Components/Home";
import Products from "./Components/Products";
import ProductDetails from "./Components/ProductDetails";
import Categories from "./Components/Categories";
import Brands from "./Components/Brands";
import Wishlist from "./Components/Wishlist";
import Cart from "./Components/Cart";
import Checkout from "./Components/Checkout";
import Login from "./Components/Login";
import Register from "./Components/Register";
import ForgotPassword from "./Components/ForgotPassword";
import Account from "./Components/Account";
import Orders from "./Components/Orders";
function ProtectedRoute() {
  const { session } = useAuth();
  const location = useLocation();
  return session ? (
    <Outlet />
  ) : (
    <Navigate
      to="/login"
      state={{ from: location.pathname + location.search }}
      replace
    />
  );
}
function RouteError() {
  const error = useRouteError();
  return (
    <div className="status">
      <h1>Something went wrong</h1>
      <p>
        {error?.status === 404
          ? "This page does not exist."
          : "Please reload the page and try again."}
      </p>
      <a className="btn" href="/">
        Back to home
      </a>
    </div>
  );
}
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: "products", element: <Products /> },
      { path: "products/:id", element: <ProductDetails /> },
      { path: "categories", element: <Categories /> },
      { path: "brands", element: <Brands /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPassword /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "wishlist", element: <Wishlist /> },
          { path: "cart", element: <Cart /> },
          { path: "checkout", element: <Checkout /> },
          { path: "allorders", element: <Orders /> },
          { path: "account", element: <Account /> },
        ],
      },
      {
        path: "*",
        element: (
          <div className="status">
            <p className="eyebrow">404</p>
            <h1>A little off the beaten path.</h1>
            <p>This page doesn’t exist. Let’s find something good instead.</p>
            <Link className="btn" to="/">
              Back to home
            </Link>
          </div>
        ),
      },
    ],
  },
]);
export default function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
