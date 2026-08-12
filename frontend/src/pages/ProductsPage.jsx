
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaBoxOpen,
  FaChevronDown,
  FaSearch,
  FaSlidersH,
  FaTimes,
} from "react-icons/fa";
import ProductCard from "../components/ProductCard";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const getCategoryName = (category) => {
  if (!category) return "Uncategorized";
  return typeof category === "string" ? category : category.name || "Uncategorized";
};

const getCategoryKey = (category) => {
  if (!category) return "uncategorized";
  if (typeof category === "string") return category;
  return category.slug || category._id || category.name || "uncategorized";
};

const normalizeVariants = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.variants)) return payload.variants;
  return [];
};

const buildStorefrontData = (variants) => {
  const activeVariants = variants.filter((variant) => variant?.isActive !== false);
  const availableVariants = activeVariants.filter(
    (variant) => Number(variant?.stock || 0) > 0
  );

  const pricedVariants = activeVariants.filter((variant) =>
    Number.isFinite(Number(variant?.price))
  );

  const prices = pricedVariants.map((variant) => Number(variant.price));
  const defaultVariant =
    activeVariants.find((variant) => variant.isDefault) ||
    availableVariants[0] ||
    activeVariants[0] ||
    null;

  return {
    variants: activeVariants,
    defaultVariant,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    totalStock: activeVariants.reduce(
      (sum, variant) => sum + Number(variant?.stock || 0),
      0
    ),
    inStock: availableVariants.length > 0,
    variantCount: activeVariants.length,
  };
};

const ProductSkeleton = () => (
  <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
    <div className="aspect-[4/4.7] animate-pulse bg-slate-100" />
    <div className="space-y-3 p-5">
      <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
      <div className="h-5 w-4/5 animate-pulse rounded-full bg-slate-100" />
      <div className="h-4 w-full animate-pulse rounded-full bg-slate-100" />
      <div className="h-6 w-28 animate-pulse rounded-full bg-slate-100" />
    </div>
  </div>
);

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const response = await axios.get(`${API_BASE_URL}/products`);

        // Today's backend returns:
        // { products: [...], pagination: {...} }
        // The Array fallback keeps this page compatible with the older API too.
        const productList = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.products)
            ? response.data.products
            : [];

        const enrichedProducts = await Promise.all(
          productList.map(async (product) => {
            try {
              const variantResponse = await axios.get(
                `${API_BASE_URL}/products/${product._id}/variants`
              );

              const variants = normalizeVariants(variantResponse.data);

              return {
                ...product,
                storefront: buildStorefrontData(variants),
              };
            } catch (variantError) {
              console.warn(
                `Could not load variants for product ${product._id}:`,
                variantError
              );

              return {
                ...product,
                storefront: buildStorefrontData([]),
              };
            }
          })
        );

        if (!cancelled) {
          setProducts(enrichedProducts);
        }
      } catch (error) {
        console.error("Products loading error:", error);

        if (!cancelled) {
          setProducts([]);
          setLoadError(
            error.response?.data?.message ||
              "We couldn't load the collection right now. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const categoryMap = new Map();

    products.forEach((product) => {
      const key = getCategoryKey(product.category);
      const name = getCategoryName(product.category);

      if (!categoryMap.has(key)) {
        categoryMap.set(key, { key, name });
      }
    });

    return [...categoryMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch) ||
        product.shortDescription?.toLowerCase().includes(normalizedSearch) ||
        product.brand?.toLowerCase().includes(normalizedSearch) ||
        getCategoryName(product.category)
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        !selectedCategory ||
        getCategoryKey(product.category) === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      const aPrice = a.storefront?.minPrice;
      const bPrice = b.storefront?.minPrice;

      if (sortBy === "price-low") {
        if (aPrice == null) return 1;
        if (bPrice == null) return -1;
        return aPrice - bPrice;
      }

      if (sortBy === "price-high") {
        if (aPrice == null) return 1;
        if (bPrice == null) return -1;
        return bPrice - aPrice;
      }

      if (sortBy === "newest") {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }

      // Featured products first, then preserve API order.
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    });
  }, [products, searchTerm, selectedCategory, sortBy]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSortBy("featured");
  };

  const hasFilters =
    Boolean(searchTerm) ||
    Boolean(selectedCategory) ||
    sortBy !== "featured";

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Shop the collection
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                Products worth
                <span className="block text-slate-400">discovering.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Explore our latest collection, compare available options, and
                choose the variant that fits you best.
              </p>
            </div>

            {!loading && !loadError && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Collection
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                  {products.length}
                  <span className="ml-1 text-sm font-medium text-slate-400">
                    {products.length === 1 ? "product" : "products"}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_12px_45px_rgba(15,23,42,0.035)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_210px_auto]">
            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products, brands or categories..."
                className="h-12 w-full rounded-2xl border border-transparent bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-slate-100 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-12 w-full appearance-none rounded-2xl border border-transparent bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
            </div>

            <div className="relative">
              <FaSlidersH className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="h-12 w-full appearance-none rounded-2xl border border-transparent bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100"
              >
                <option value="featured">Featured first</option>
                <option value="newest">Newest</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
              >
                <FaTimes className="text-xs" />
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-[32px] border border-red-100 bg-white px-6 py-16 text-center shadow-[0_16px_50px_rgba(15,23,42,0.035)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <FaBoxOpen className="text-2xl" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              Collection unavailable
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FaSearch className="text-xl" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              No products found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try another search or remove your current filters.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {filteredProducts.length}
                </span>{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </p>
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.045,
                  },
                },
              }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product._id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </section>
    </main>
  );
};

export default ProductsPage;