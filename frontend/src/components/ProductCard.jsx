import React from "react";
import { Link } from "react-router";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaHeart,
  FaLayerGroup,
} from "react-icons/fa";
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
    return "https://placehold.co/900x1050/f8fafc/64748b?text=ShopEase";
  }

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath;
  }

  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const getImageAlt = (image, fallback) =>
  typeof image === "object" && image?.alt ? image.alt : fallback;

const getCategoryName = (category) => {
  if (!category) return "Collection";
  return typeof category === "string"
    ? category
    : category.name || "Collection";
};

const ProductCard = ({ product }) => {
  const { isWishlisted, toggleWishlist } = useStore();
  const storefront = product.storefront || {};
  const defaultVariant = storefront.defaultVariant;
  const productImage =
    defaultVariant?.images?.[0] || product.images?.[0] || null;

  const minPrice = storefront.minPrice;
  const maxPrice = storefront.maxPrice;
  const hasPrice = minPrice !== null && minPrice !== undefined;
  const hasPriceRange =
    hasPrice &&
    maxPrice !== null &&
    maxPrice !== undefined &&
    Number(maxPrice) > Number(minPrice);

  const compareAtPrice = Number(defaultVariant?.compareAtPrice || 0);
  const currentDefaultPrice = Number(defaultVariant?.price || 0);
  const hasDiscount =
    compareAtPrice > 0 &&
    currentDefaultPrice > 0 &&
    compareAtPrice > currentDefaultPrice;

  const discountPercent = hasDiscount
    ? Math.round(
        ((compareAtPrice - currentDefaultPrice) / compareAtPrice) * 100
      )
    : 0;

  const inStock = storefront.inStock;
  const variantCount = storefront.variantCount || 0;
  const wishlisted = isWishlisted(product._id);

  const handleWishlist = () => {
    toggleWishlist({
      productId: product._id,
      name: product.name,
      brand: product.brand || "",
      categoryName: getCategoryName(product.category),
      image: productImage,
      minPrice,
      maxPrice,
      inStock,
      variantCount,
    });
  };

  return (
    <article className="group h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)]">
      <Link
        to={`/product/${product._id}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[4/4.7] overflow-hidden bg-[#f1f1ef]">
          <img
            src={getImageUrl(productImage)}
            alt={getImageAlt(productImage, product.name)}
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.055]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src =
                "https://placehold.co/900x1050/f8fafc/64748b?text=ShopEase";
            }}
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex flex-wrap gap-2">
              {product.featured && (
                <span className="rounded-full bg-slate-950 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
                  Featured
                </span>
              )}

              {hasDiscount && (
                <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-rose-600 shadow-sm">
                  -{discountPercent}%
                </span>
              )}
            </div>

            <span
              className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold backdrop-blur ${
                inStock
                  ? "border-emerald-100 bg-white/90 text-emerald-700"
                  : "border-slate-200 bg-white/90 text-slate-500"
              }`}
            >
              {inStock ? "In stock" : "Unavailable"}
            </span>
          </div>

          <div className="absolute inset-x-4 bottom-4 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl">
              View product
              <FaArrowRight className="text-[10px]" />
            </div>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {product.brand || getCategoryName(product.category)}
          </p>

          {variantCount > 1 && (
            <div className="flex shrink-0 items-center gap-1.5 text-[10px] font-medium text-slate-400">
              <FaLayerGroup className="text-[9px]" />
              {variantCount} options
            </div>
          )}
        </div>

        <Link to={`/product/${product._id}`}>
          <h3 className="mt-2 line-clamp-2 min-h-[48px] text-[17px] font-semibold leading-6 tracking-[-0.02em] text-slate-950 transition group-hover:text-slate-700">
            {product.name}
          </h3>
        </Link>

        {(product.shortDescription || product.description) && (
          <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
            {product.shortDescription || product.description}
          </p>
        )}

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
              {hasPriceRange ? "Starting from" : "Price"}
            </p>

            {hasPrice ? (
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-lg font-semibold tracking-tight text-slate-950">
                  {formatPrice(minPrice)}
                </span>

                {hasDiscount &&
                  Number(defaultVariant?.price) === Number(minPrice) && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatPrice(compareAtPrice)}
                    </span>
                  )}
              </div>
            ) : (
              <span className="text-sm font-semibold text-slate-700">
                View options
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWishlist}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${
              wishlisted
                ? "border-rose-200 bg-rose-50 text-rose-500"
                : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
            }`}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <FaHeart className="text-sm" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
