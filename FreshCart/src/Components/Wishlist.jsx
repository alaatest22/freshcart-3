import { useShop } from "../Context/contexts";
import ProductCard from "./ProductCard";
import { Empty, ErrorState, Heading, Loading } from "./UI";
export default function Wishlist() {
  const { wishlist, loading, errors, refresh } = useShop();
  return (
    <div className="container page">
      <Heading
        eyebrow="KEPT CLOSE"
        title="Your wishlist."
        text={`${wishlist.length} favorites, waiting for you.`}
      />
      {loading ? (
        <Loading />
      ) : errors.wishlist ? (
        <ErrorState message={errors.wishlist} retry={refresh} />
      ) : wishlist.length ? (
        <div className="product-grid">
          {wishlist.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      ) : (
        <Empty
          title="Your next favorite is out there"
          text="Tap the heart on any product to save it here."
        />
      )}
    </div>
  );
}
