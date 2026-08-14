import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaHeadset,
  FaLayerGroup,
  FaLock,
  FaShoppingBag,
  FaShieldAlt,
  FaStar,
  FaTag,
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
    return "https://placehold.co/1000x1200/f1f5f9/94a3b8?text=ShopEase";
  }

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;

  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const getImageAlt = (image, fallback) =>
  typeof image === "object" && image?.alt ? image.alt : fallback;

const getProductImage = (product) =>
  product?.storefront?.defaultVariant?.images?.[0] || product?.images?.[0];

const getProductPrice = (product) => {
  const value = product?.storefront?.minPrice;
  return value === null || value === undefined ? null : Number(value);
};

const categoryStyles = [
  "from-violet-500/15 via-violet-100 to-white",
  "from-blue-500/15 via-blue-100 to-white",
  "from-emerald-500/15 via-emerald-100 to-white",
  "from-amber-500/15 via-amber-100 to-white",
  "from-fuchsia-500/15 via-fuchsia-100 to-white",
  "from-cyan-500/15 via-cyan-100 to-white",
];

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const ProductSkeleton = () => (
  <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white">
    <div className="aspect-[4/4.8] animate-pulse bg-slate-100" />
    <div className="space-y-3 p-5">
      <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-3/4 animate-pulse rounded-full bg-slate-100" />
      <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
    </div>
  </div>
);

const HeroVisual = ({ products }) => {
  const primary = products[0];
  const secondary = products[1] || products[0];
  const tertiary = products[2] || products[1] || products[0];

  const primaryImage = getProductImage(primary);
  const secondaryImage = getProductImage(secondary);
  const tertiaryImage = getProductImage(tertiary);
  const primaryPrice = getProductPrice(primary);

  return (
    <div className="relative mx-auto min-h-[520px] w-full max-w-[590px] lg:min-h-[610px]">
      <div className="absolute left-[8%] top-[5%] h-[78%] w-[76%] rounded-[48px] bg-gradient-to-br from-violet-200/80 via-white to-blue-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]" />
      <div className="absolute right-[1%] top-[16%] h-44 w-44 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="absolute bottom-[4%] left-[2%] h-44 w-44 rounded-full bg-violet-300/30 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 26, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.75 }}
        className="absolute left-[13%] top-0 z-10 h-[76%] w-[68%] overflow-hidden rounded-[38px] border border-white/80 bg-white p-2.5 shadow-[0_35px_100px_rgba(15,23,42,0.2)]"
      >
        <div className="relative h-full overflow-hidden rounded-[31px] bg-slate-100">
          <img
            src={getImageUrl(primaryImage)}
            alt={getImageAlt(primaryImage, primary?.name || "Featured product")}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent px-6 pb-6 pt-28 text-white">
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-200">
                  Featured edit
                </p>
                <h3 className="mt-2 truncate text-xl font-semibold tracking-tight sm:text-2xl">
                  {primary?.name || "ShopEase collection"}
                </h3>
              </div>

              {primaryPrice !== null && (
                <div className="shrink-0 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-right backdrop-blur-md">
                  <p className="text-[9px] uppercase tracking-[0.16em] text-white/55">
                    From
                  </p>
                  <p className="mt-0.5 text-sm font-semibold">
                    {formatPrice(primaryPrice)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24, rotate: 8 }}
        animate={{ opacity: 1, x: 0, rotate: 4 }}
        transition={{ duration: 0.7, delay: 0.14 }}
        className="absolute right-[2%] top-[11%] z-20 h-[34%] w-[34%] overflow-hidden rounded-[28px] border-[6px] border-white bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
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
        initial={{ opacity: 0, x: 20, rotate: -7 }}
        animate={{ opacity: 1, x: 0, rotate: -3 }}
        transition={{ duration: 0.7, delay: 0.24 }}
        className="absolute bottom-[4%] right-[8%] z-20 h-[29%] w-[30%] overflow-hidden rounded-[26px] border-[6px] border-white bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)]"
      >
        <img
          src={getImageUrl(tertiaryImage || primaryImage)}
          alt={getImageAlt(
            tertiaryImage || primaryImage,
            tertiary?.name || primary?.name || "ShopEase product"
          )}
          className="h-full w-full object-cover"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.36 }}
        className="absolute bottom-[12%] left-0 z-30 rounded-[22px] border border-slate-200 bg-white px-4 py-3.5 shadow-[0_20px_55px_rgba(15,23,42,0.13)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-950">Live availability</p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Price, stock & variants
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collectionCount, setCollectionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setLoadError("");

        /*
         * Homepage intentionally fetches only FOUR products.
         * The same API response already includes categories and total count,
         * so there is no reason to download the full catalog here.
         */
        const response = await axios.get(`${API_BASE_URL}/products`, {
          params: {
            limit: 4,
            sort: "featured",
          },
        });

        const productList = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.products)
            ? response.data.products
            : [];

        const categoryList = Array.isArray(response.data?.categories)
          ? response.data.categories
          : [];

        if (!cancelled) {
          setProducts(productList.slice(0, 4));
          setCategories(categoryList.slice(0, 6));
          setCollectionCount(
            Number(response.data?.pagination?.total) || productList.length
          );
        }
      } catch (error) {
        console.error("Home data loading error:", error);

        if (!cancelled) {
          setProducts([]);
          setCategories([]);
          setCollectionCount(0);
          setLoadError(
            error.response?.data?.message ||
              "We couldn't load the featured collection right now."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const heroProducts = useMemo(() => products.slice(0, 3), [products]);
  const editorialProduct = products[2] || products[0];
  const editorialImage = getProductImage(editorialProduct);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute -left-40 top-12 h-96 w-96 rounded-full bg-violet-100/60 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">
              <FaShoppingBag className="text-[10px]" />
              Designed for modern shopping
            </div>

            <h1 className="mt-7 max-w-[760px] text-5xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-[74px] lg:leading-[0.96]">
              Better products.
              <span className="block bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                Better buying.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
              Shop curated products with clear variants, live inventory, product-specific delivery pricing, and a checkout built to keep every detail simple.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Shop the collection
                <FaArrowRight className="text-[10px]" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Need help?
                <FaHeadset className="text-xs" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                {
                  icon: FaShieldAlt,
                  label: "Server validated",
                  text: "Price & stock",
                },
                {
                  icon: FaTruck,
                  label: "Smart delivery",
                  text: "Region based",
                },
                {
                  icon: FaLayerGroup,
                  label: "Real variants",
                  text: "Exact selection",
                },
              ].map(({ icon: Icon, label, text }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3.5 backdrop-blur"
                >
                  <Icon className="text-xs text-violet-600" />
                  <p className="mt-2 text-xs font-semibold text-slate-900">{label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <HeroVisual products={heroProducts} />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 lg:px-8">
          {[
            {
              icon: FaLock,
              title: "Secure order flow",
              description: "Important order values are checked by the backend.",
            },
            {
              icon: FaTruck,
              title: "Location-based delivery",
              description: "Delivery charges are shown before the order is placed.",
            },
            {
              icon: FaBoxOpen,
              title: "Live inventory",
              description: "Customers buy the exact active variant that is in stock.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-4 py-6 sm:px-6 first:sm:pl-0 last:sm:pr-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-violet-300">
                <Icon />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-white/45">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Browse with purpose
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Shop by category
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Start with the part of the collection that matches what you need.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-violet-600"
            >
              Browse everything
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
            className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {categories.map((category, index) => (
              <motion.div key={category._id || category.slug || category.name} variants={reveal}>
                <Link
                  to={
                    category.slug
                      ? `/products?category=${encodeURIComponent(category.slug)}`
                      : "/products"
                  }
                  className={`group relative block min-h-[190px] overflow-hidden rounded-[30px] border border-slate-200 bg-gradient-to-br ${categoryStyles[index % categoryStyles.length]} p-6 transition hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(15,23,42,0.1)]`}
                >
                  <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/70 bg-white/35" />
                  <div className="absolute -bottom-12 right-10 h-28 w-28 rounded-full bg-white/30 blur-xl" />

                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                        <FaTag className="text-sm" />
                      </div>

                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-600">
                        <FaArrowRight className="text-[10px]" />
                      </div>
                    </div>

                    <div className="mt-10">
                      <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                        {category.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 max-w-[280px] text-xs leading-5 text-slate-500">
                        {category.description || "Explore products in this collection."}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                Featured now
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                A tighter edit, not the whole catalog
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                The homepage intentionally shows only a small featured selection. The full catalog stays on the Shop page where it belongs.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-violet-600"
            >
              View full catalog
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
            <div className="rounded-[30px] border border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <p className="text-sm font-medium text-slate-700">{loadError}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-[30px] border border-slate-200 bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
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
              viewport={{ once: true, amount: 0.12 }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {products.map((product) => (
                <motion.div key={product._id} variants={reveal}>
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid overflow-hidden rounded-[38px] border border-slate-200 bg-slate-950 shadow-[0_25px_80px_rgba(15,23,42,0.14)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[420px] overflow-hidden bg-slate-900">
            <img
              src={getImageUrl(editorialImage)}
              alt={getImageAlt(
                editorialImage,
                editorialProduct?.name || "ShopEase collection"
              )}
              className="absolute inset-0 h-full w-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300">
                Curated storefront
              </p>
              <h3 className="mt-3 max-w-md text-3xl font-semibold tracking-[-0.04em] text-white">
                Products presented with the details people actually need.
              </h3>
            </div>
          </div>

          <div className="flex flex-col justify-center px-6 py-10 text-white sm:px-10 sm:py-14 lg:px-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Built around confidence
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              From selection to delivery, the important details stay visible.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/55">
              Customers can choose the exact variant, see live stock, select an available delivery region, and review the final total before placing an order.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: FaCheckCircle,
                  title: "Exact variant selection",
                  text: "Options map to a real purchasable SKU.",
                },
                {
                  icon: FaTruck,
                  title: "Delivery before checkout",
                  text: "Region-specific charges update the total.",
                },
                {
                  icon: FaShieldAlt,
                  title: "Backend price authority",
                  text: "The server calculates the final order value.",
                },
                {
                  icon: FaStar,
                  title: "Focused merchandising",
                  text: "Only featured products are shown here.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <Icon className="text-sm text-violet-300" />
                  <p className="mt-3 text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-white/45">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: FaShieldAlt,
              title: "Ordering you can trust",
              description:
                "Stock and pricing are checked again when the order reaches the backend.",
            },
            {
              icon: FaTruck,
              title: "Delivery that makes sense",
              description:
                "Each product can have different delivery charges across supported regions.",
            },
            {
              icon: FaHeadset,
              title: "Support when needed",
              description:
                "Customers can reach out directly when they need help before ordering.",
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.035)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                <Icon />
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-950">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-[38px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 px-6 py-10 text-white shadow-[0_24px_80px_rgba(79,70,229,0.22)] sm:px-10 sm:py-12 lg:px-14">
            <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/15" />
            <div className="absolute -bottom-24 right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                  ShopEase collection
                </p>
                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                  Ready to explore the complete store?
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                  {collectionCount > 0
                    ? `${collectionCount} ${
                        collectionCount === 1 ? "product is" : "products are"
                      } currently available across the full catalog.`
                    : "The complete catalog is available on the Shop page."}
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
        </div>
      </section>
    </main>
  );
};

export default Home;