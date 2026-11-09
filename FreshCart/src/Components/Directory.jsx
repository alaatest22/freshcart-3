import { imageFallback } from "../lib/api";
import { Link } from "react-router-dom";
import { useState } from "react";
import useResource from "../hooks/useResource";
import { ErrorState, Heading, Loading } from "./UI";
export default function Directory({ type }) {
  const [page, setPage] = useState(1);
  const resource = useResource(`/${type}?limit=24&page=${page}`);
  const isBrand = type === "brands";
  return (
    <div className="container page">
      <Heading
        eyebrow={
          isBrand
            ? "NAMES YOU KNOW. FINDS YOU’LL LOVE."
            : "A LITTLE OF EVERYTHING"
        }
        title={isBrand ? "Discover our brands." : "Shop your world."}
        text={
          isBrand
            ? "Explore the names behind your everyday favorites."
            : "Find your way to something good, one category at a time."
        }
      />
      {resource.loading ? (
        <Loading />
      ) : resource.error ? (
        <ErrorState message={resource.error} retry={resource.retry} />
      ) : (
        <>
          <div className={`directory-grid ${isBrand ? "brands-grid" : ""}`}>
            {resource.data?.data.map((item) => (
              <Link
                className="directory-card"
                key={item._id}
                to={`/products?${isBrand ? "brand" : "category"}=${item._id}`}
              >
                <div>
                  <img
                    onError={imageFallback}
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                  />
                </div>
                <h2>
                  {item.name}
                  <span>↗</span>
                </h2>
              </Link>
            ))}
          </div>
          {!resource.data?.data.length && <p>No {type} available.</p>}
          {resource.data?.metadata?.numberOfPages > 1 && (
            <div className="pagination">
              <button
                className="btn secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span>
                {page} / {resource.data.metadata.numberOfPages}
              </span>
              <button
                className="btn secondary"
                disabled={page === resource.data.metadata.numberOfPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
