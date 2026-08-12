
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaLock,
  FaShoppingBag,
  FaShieldAlt,
  FaTruck,
} from "react-icons/fa";
import ProductCard from "../components/ProductCard";

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
    return "https://placehold.co/900x1100/f3f4f6/94a3b8?text=ShopEase";
  }

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;

  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const getImageAlt = (image, fallback) =>
  typeof image === "object" && image?.alt ? image.alt : fallback;

const normalizeVariants = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.variants)) return payload.variants;
  return [];
};

const buildStorefrontData = (variants) => {
  const activeVariants = variants.filter((variant) => variant?.isActive !== false);
  const inStockVariants = activeVariants.filter(
    (variant) => Number(variant?.stock || 0) > 0
  );
  const pricedVariants = activeVariants.filter((variant) =>
    Number.isFinite(Number(variant?.price))
  );

  const prices = pricedVariants.map((variant) => Number(variant.price));

  const defaultVariant =
    activeVariants.find((variant) => variant.isDefault) ||
    inStockVariants[0] ||
    activeVariants[0] ||
    null;

  return {
    variants: activeVariants,
    defaultVariant,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    inStock: inStockVariants.length > 0,
    variantCount: activeVariants.length,
  };
};

const HeroVisual = ({ products }) => {
  const primary = products[0];
  const secondary = products[1];

  const primaryImage =
    primary?.storefront?.defaultVariant?.images?.[0] ||
    primary?.images?.[0];

  const secondaryImage =
    secondary?.storefront?.defaultVariant?.images?.[0] ||
    secondary?.images?.[0];

  const primaryPrice = primary?.storefront?.minPrice;

  return (
    <div className="relative mx-auto min-h-[430px] w-full max-w-[540px] sm:min-h-[520px]">
      <div className="absolute left-[8%] top-[5%] h-[78%] w-[72%] rotate-[-4deg] rounded-[42px] bg-gradient-to-br from-violet-200 via-violet-100 to-blue-100" />

      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7 }}
        className="absolute left-[14%] top-0 z-10 h-[76%] w-[67%] overflow-hidden rounded-[34px] border border-white/70 bg-white p-2 shadow-[0_35px_100px_rgba(15,23,42,0.18)]"
      >
        <div className="relative h-full overflow-hidden rounded-[28px] bg-slate-100">
          <img
            src={getImageUrl(primaryImage)}
            alt={getImageAlt(primaryImage, primary?.name || "Featured product")}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent p-5 pt-20 text-white sm:p-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">
              Featured selection
            </p>
            <p className="mt-1 line-clamp-1 text-lg font-semibold sm:text-xl">
              {primary?.name || "Discover ShopEase"}
            </p>
            {primaryPrice !== null && primaryPrice !== undefined && (
              <p className="mt-1 text-sm font-medium text-white/80">
                From {formatPrice(primaryPrice)}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20, rotate: 6 }}
        animate={{ opacity: 1, x: 0, rotate: 3 }}
        transition={{ duration: 0.7, delay: 0.14 }}
        className="absolute bottom-[2%] right-[2%] z-20 h-[40%] w-[39%] overflow-hidden rounded-[26px] border-[5px] border-white bg-white shadow-[0_24px_70px_rgba(15,23,42,0.17)]"
      >
        <img
          src={getImageUrl(secondaryImage || primaryImage)}
          alt={getImageAlt(
            secondaryImage || primaryImage,
            secondary?.name || primary?.name || "ShopEase product"
          )}
          className="h-full w-full object-cover"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.35 }}
        className="absolute bottom-[8%] left-0 z-30 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-950">
              Ready to order
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Live stock & variants
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
    <div className="aspect-[4/4.7] animate-pulse bg-slate-100" />
    <div className="space-y-3 p-5">
      <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-100" />
      <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
    </div>
  </div>
);

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await axios.get(`${API_BASE_URL}/products`);

        const productList = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.products)
            ? response.data.products
            : [];

        const selectedProducts = productList.slice(0, 8);

        const enriched = await Promise.all(
          selectedProducts.map(async (product) => {
            try {
              const variantResponse = await axios.get(
                `${API_BASE_URL}/products/${product._id}/variants`
              );

              return {
                ...product,
                storefront: buildStorefrontData(
                  normalizeVariants(variantResponse.data)
                ),
              };
            } catch (error) {
              console.warn(
                `Could not load variants for ${product._id}:`,
                error
              );

              return {
                ...product,
                storefront: buildStorefrontData([]),
              };
            }
          })
        );

        if (!cancelled) setProducts(enriched);
      } catch (error) {
        console.error("Home products loading error:", error);

        if (!cancelled) {
          setLoadError(
            error.response?.data?.message ||
              "We couldn't load the latest products right now."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredProducts = useMemo(() => {
    const featured = products.filter((product) => product.featured);
    return (featured.length ? featured : products).slice(0, 4);
  }, [products]);

  const collectionCount = products.length;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-violet-100/50 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
              <FaShoppingBag className="text-[10px]" />
              Modern shopping, made simple
            </div>

            <h1 className="mt-7 text-5xl font-semibold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[72px] lg:leading-[0.98]">
              Find what fits
              <span className="block bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
                your everyday.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
              Thoughtfully presented products, clear options, live availability,
              and a checkout experience designed to feel effortless.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Explore collection
                <FaArrowRight className="text-[10px]" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Contact us
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" />
                Variant-aware shopping
              </span>
              <span className="inline-flex items-center gap-2">
                <FaLock className="text-violet-500" />
                Secure checkout flow
              </span>
              <span className="inline-flex items-center gap-2">
                <FaTruck className="text-blue-500" />
                Cash on delivery
              </span>
            </div>
          </motion.div>

          <HeroVisual products={products} />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f7f7f5]">
        <div className="mx-auto grid max-w-7xl gap-px px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            {
              icon: FaTruck,
              title: "Delivery focused",
              description: "Clear order details before checkout.",
            },
            {
              icon: FaShieldAlt,
              title: "Reliable ordering",
              description: "Price and stock validated by the server.",
            },
            {
              icon: FaBoxOpen,
              title: "Product options",
              description: "Choose the exact variant you want.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex items-center gap-4 border-b border-slate-200 py-5 sm:border-b-0 sm:border-r sm:px-6 first:sm:pl-0 last:sm:border-r-0 last:sm:pr-0"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                <Icon />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
              Curated for you
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Featured products
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              A quick look at what’s available in the store right now.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-violet-600"
          >
            View all products
            <FaArrowRight className="text-[10px]" />
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">{loadError}</p>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="rounded-[30px] border border-slate-200 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FaBoxOpen />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-950">
              Products are coming soon.
            </p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.06 },
              },
            }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {featuredProducts.map((product) => (
              <motion.div
                key={product._id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="overflow-hidden rounded-[36px] bg-slate-950">
          <div className="grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:px-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
                ShopEase collection
              </p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Explore the complete collection.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
                {collectionCount > 0
                  ? `${collectionCount} ${
                      collectionCount === 1 ? "product is" : "products are"
                    } currently available to explore.`
                  : "New products will appear here as soon as they are published."}
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Shop all products
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;