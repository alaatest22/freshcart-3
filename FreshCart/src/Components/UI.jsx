import { Link } from "react-router-dom";
export function Loading({ text = "Finding something good for you…" }) {
  return (
    <div className="status" role="status">
      <span className="spinner" />
      <p>{text}</p>
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="status" role="alert">
      <h2>Something went wrong</h2>
      <p>{message}</p>
      {retry && (
        <button className="btn" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
export function Empty({
  title,
  text = "Explore our collection and find your next favorite.",
  action = "Explore products",
}) {
  return (
    <div className="status empty">
      <span className="empty-icon">⌑</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <Link className="btn" to="/products">
        {action}
      </Link>
    </div>
  );
}
export function Heading({ eyebrow, title, text, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {text && <p className="muted">{text}</p>}
      </div>
      {children}
    </div>
  );
}
export function Field({ label, name, type = "text", ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} {...props} />
    </label>
  );
}
export function Icon({ name, ...props }) {
  const paths = {
    cart: "M3 3h2l3 12h11l3-9H6M9 20h.01M18 20h.01",
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    user: "M20 21v-2a7 7 0 0 0-14 0v2M17 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    bag: "M4 7h16l1 14H3L4 7Zm4 0V5a4 4 0 0 1 8 0v2",
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name] || paths.bag} />
    </svg>
  );
}
