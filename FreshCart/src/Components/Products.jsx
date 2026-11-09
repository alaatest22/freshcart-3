import { useSearchParams } from "react-router-dom";
import useResource from "../hooks/useResource";
import ProductCard from "./ProductCard";
import { Empty, ErrorState, Heading, Loading } from "./UI";
export default function Products() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const query = new URLSearchParams({ limit: "12", page: String(page) });
  ["keyword", "category", "brand", "sort"].forEach((key) => {
    if (params.get(key)) query.set(key, params.get(key));
  });
  const products = useResource(`/products?${query}`);
  const categories = useResource("/categories?limit=100");
  const brands = useResource("/brands?limit=100");
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    setParams(next);
  };
  return (
    <div className="container page">
      <Heading
        eyebrow="THE COLLECTION"
        title="Find your everyday favorites."
        text="Thoughtful finds across fashion, tech, home and more."
      />
      <div className="shop-toolbar">
        <form
          key={params.get("keyword") || ""}
          className="catalog-search"
          onSubmit={(e) => {
            e.preventDefault();
            update("keyword", new FormData(e.currentTarget).get("keyword"));
          }}
        >
          <input
            name="keyword"
            aria-label="Search collection"
            defaultValue={params.get("keyword") || ""}
            placeholder="Search the collection"
          />
          <button className="btn">Search</button>
        </form>
        <label>
          Sort by
          <select
            value={params.get("sort") || ""}
            onChange={(e) => update("sort", e.target.value)}
          >
            <option value="">Recommended</option>
            <option value="price">Price: low to high</option>
            <option value="-price">Price: high to low</option>
            <option value="-ratingsAverage">Top rated</option>
            <option value="-createdAt">Newest</option>
          </select>
        </label>
      </div>
      <div className="shop-layout">
        <aside className="filters">
          <h3>Refine your search</h3>
          <label>
            Category
            <select
              disabled={categories.loading}
              value={params.get("category") || ""}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.data?.data.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Brand
            <select
              disabled={brands.loading}
              value={params.get("brand") || ""}
              onChange={(e) => update("brand", e.target.value)}
            >
              <option value="">All brands</option>
              {brands.data?.data.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          {(categories.error || brands.error) && (
            <p className="inline-error">Some filters could not load.</p>
          )}
          <button className="text-button" onClick={() => setParams({})}>
            Reset filters
          </button>
        </aside>
        <section aria-label="Products">
          {products.loading ? (
            <Loading />
          ) : products.error ? (
            <ErrorState message={products.error} retry={products.retry} />
          ) : (
            <>
              <p className="results-note">
                {products.data?.results || 0} products on this page
              </p>
              {products.data?.data.length ? (
                <div className="product-grid catalog-grid">
                  {products.data.data.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              ) : (
                <Empty
                  title="No matches this time"
                  text="Try another search or reset the filters."
                />
              )}
              <div className="pagination">
                <button
                  className="btn secondary"
                  disabled={page <= 1}
                  onClick={() => update("page", String(page - 1))}
                >
                  ← Previous
                </button>
                <span>
                  Page {page} of {products.data?.metadata?.numberOfPages || 1}
                </span>
                <button
                  className="btn secondary"
                  disabled={
                    page >= (products.data?.metadata?.numberOfPages || 1)
                  }
                  onClick={() => update("page", String(page + 1))}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
