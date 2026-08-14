
import React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { FaArrowRight, FaHeart, FaTrash } from "react-icons/fa";
import { useStore } from "../context/storeContext";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

const getServerOrigin = () => {
  if (!API_BASE_URL) return "";
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
};

const getImageUrl = (image) => {
  const rawPath = typeof image === "string" ? image : image?.url;
  if (!rawPath) {
    return "https://placehold.co/800x900/f8fafc/94a3b8?text=ShopEase";
  }

  const cleanPath = String(rawPath).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const WishlistPage = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useStore();

  if (wishlistItems.length === 0) {
    return (
      <main className="min-h-[72vh] bg-[#f7f7f5] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <FaHeart className="text-xl" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            Nothing saved yet.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Save products while browsing and come back to them later. Your wishlist stays on this device without requiring an account.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Explore products
            <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">
                Wishlist
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Saved for later.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Saved product snapshots are stored locally. Open a product to see its latest price, stock, and available variants.
              </p>
            </div>

            <button
              type="button"
              onClick={clearWishlist}
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <FaTrash className="text-[10px]" />
              Clear wishlist
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistItems.map((item, index) => (
            <motion.article
              key={item.productId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.035)]"
            >
              <div className="relative aspect-[4/4.7] overflow-hidden bg-slate-100">
                <Link to={`/product/${item.productId}`} className="block h-full">
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-rose-50"
                  aria-label={`Remove ${item.name} from wishlist`}
                >
                  <FaHeart />
                </button>
              </div>

              <div className="p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {item.brand || item.categoryName || "ShopEase"}
                </p>
                <Link to={`/product/${item.productId}`}>
                  <h2 className="mt-2 line-clamp-2 min-h-[48px] text-lg font-semibold leading-6 text-slate-950 transition hover:text-violet-700">
                    {item.name}
                  </h2>
                </Link>

                <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">
                      Saved price
                    </p>
                    <p className="mt-1 font-semibold">
                      {item.minPrice !== null && item.minPrice !== undefined
                        ? formatPrice(item.minPrice)
                        : "View product"}
                    </p>
                  </div>

                  <Link
                    to={`/product/${item.productId}`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-violet-700"
                    aria-label={`View ${item.name}`}
                  >
                    <FaArrowRight className="text-[10px]" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default WishlistPage;