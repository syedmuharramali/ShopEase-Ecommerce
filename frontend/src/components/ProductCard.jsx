import React from "react";
import { Link } from "react-router";
import {
  FaArrowRight,
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
    <article className="group h-full overflow-hidden rounded-[20px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:rounded-[22px]">
      <Link
        to={`/product/${product._id}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        <div className="relative aspect-[4/4.45] overflow-hidden bg-[#f1f1ef] sm:aspect-[4/4.6]">
          <img
            src={getImageUrl(productImage)}
            alt={getImageAlt(productImage, product.name)}
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src =
                "https://placehold.co/900x1050/f8fafc/64748b?text=ShopEase";
            }}
          />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 sm:p-3.5">
            <div className="flex flex-wrap gap-1.5">
              {product.featured && (
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-white shadow-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                  Featured
                </span>
              )}

              {hasDiscount && (
                <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-rose-600 shadow-sm sm:px-3 sm:py-1.5 sm:text-[10px]">
                  -{discountPercent}%
                </span>
              )}
            </div>

            <span
              className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold backdrop-blur sm:px-3 sm:py-1.5 sm:text-[10px] ${
                inStock
                  ? "border-emerald-100 bg-white/90 text-emerald-700"
                  : "border-slate-200 bg-white/90 text-slate-500"
              }`}
            >
              {inStock ? "In stock" : "Unavailable"}
            </span>
          </div>

          <div className="absolute inset-x-3 bottom-3 hidden translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 md:block">
            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">
              View product
              <FaArrowRight className="text-[9px]" />
            </div>
          </div>
        </div>
      </Link>

      <div className="p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 sm:text-[10px]">
            {product.brand || getCategoryName(product.category)}
          </p>

          {variantCount > 1 && (
            <div className="flex shrink-0 items-center gap-1 text-[9px] font-medium text-slate-400 sm:text-[10px]">
              <FaLayerGroup className="text-[8px] sm:text-[9px]" />
              {variantCount} options
            </div>
          )}
        </div>

        <Link to={`/product/${product._id}`}>
          <h3 className="mt-1.5 line-clamp-2 min-h-[42px] text-[15px] font-semibold leading-5 tracking-[-0.02em] text-slate-950 transition group-hover:text-slate-700 sm:mt-2 sm:min-h-[44px] sm:text-[16px] sm:leading-[22px]">
            {product.name}
          </h3>
        </Link>

        {(product.shortDescription || product.description) && (
          <p className="mt-1.5 hidden line-clamp-2 min-h-[38px] text-[13px] leading-[19px] text-slate-500 sm:block">
            {product.shortDescription || product.description}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-slate-100 pt-3 sm:mt-4 sm:pt-3.5">
          <div className="min-w-0">
            <p className="mb-0.5 text-[9px] font-medium uppercase tracking-[0.1em] text-slate-400 sm:text-[10px]">
              {hasPriceRange ? "Starting from" : "Price"}
            </p>

            {hasPrice ? (
              <div className="flex flex-wrap items-baseline gap-1.5">
                <span className="truncate text-[15px] font-semibold tracking-tight text-slate-950 sm:text-[17px]">
                  {formatPrice(minPrice)}
                </span>

                {hasDiscount &&
                  Number(defaultVariant?.price) === Number(minPrice) && (
                    <span className="text-[10px] text-slate-400 line-through sm:text-xs">
                      {formatPrice(compareAtPrice)}
                    </span>
                  )}
              </div>
            ) : (
              <span className="text-xs font-semibold text-slate-700 sm:text-sm">
                View options
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleWishlist}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition sm:h-10 sm:w-10 ${
              wishlisted
                ? "border-rose-200 bg-rose-50 text-rose-500"
                : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
            }`}
            aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          >
            <FaHeart className="text-[13px] sm:text-sm" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
