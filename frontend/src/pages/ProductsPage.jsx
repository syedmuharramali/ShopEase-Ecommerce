// frontend/src/pages/ProductsPage.jsx

import React, {
  useEffect,
  useState,
} from "react";

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

const API_BASE_URL = (
  import.meta.env.VITE_BASE_URL || ""
).replace(/\/$/, "");

const PRODUCTS_PER_PAGE = 8;

/*
 * ----------------------------------------
 * Product loading skeleton
 * ----------------------------------------
 */

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
  /*
   * ----------------------------------------
   * Product data
   * ----------------------------------------
   */

  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  /*
   * ----------------------------------------
   * Filters
   * ----------------------------------------
   */

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("");

  const [sortBy, setSortBy] =
    useState("featured");

  /*
   * ----------------------------------------
   * Pagination
   * ----------------------------------------
   */

  const [page, setPage] =
    useState(1);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: PRODUCTS_PER_PAGE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  /*
   * ----------------------------------------
   * Search debounce
   *
   * Wait a little before calling API
   * while customer is typing.
   * ----------------------------------------
   */

  useEffect(() => {
    const timeout =
      setTimeout(() => {
        setDebouncedSearch(
          searchTerm.trim()
        );

        setPage(1);
      }, 400);

    return () =>
      clearTimeout(timeout);
  }, [searchTerm]);

  /*
   * ----------------------------------------
   * Fetch products
   *
   * Search
   * Category
   * Sorting
   * Pagination
   *
   * are now handled by backend.
   * ----------------------------------------
   */

  useEffect(() => {
    let cancelled = false;

    const fetchProducts =
      async () => {
        try {
          setLoading(true);
          setLoadError("");

          const params = {
            page,
            limit:
              PRODUCTS_PER_PAGE,
            sort: sortBy,
          };

          /*
           * Only send optional filters
           * when they actually contain
           * something.
           */

          if (debouncedSearch) {
            params.search =
              debouncedSearch;
          }

          if (selectedCategory) {
            params.category =
              selectedCategory;
          }

          const response =
            await axios.get(
              `${API_BASE_URL}/products`,
              {
                params,
              }
            );

          if (cancelled) {
            return;
          }

          /*
           * Products
           */

          const productList =
            Array.isArray(
              response.data
                ?.products
            )
              ? response.data
                  .products
              : Array.isArray(
                    response.data
                  )
                ? response.data
                : [];

          setProducts(productList);

          /*
           * Categories
           *
           * Backend now sends the full
           * active category collection.
           */

          const categoryList =
            Array.isArray(
              response.data
                ?.categories
            )
              ? response.data
                  .categories
              : [];

          setCategories(
            categoryList
          );

          /*
           * Pagination
           */

          const paginationData =
            response.data
              ?.pagination || {};

          setPagination({
            page:
              Number(
                paginationData.page
              ) || page,

            limit:
              Number(
                paginationData.limit
              ) ||
              PRODUCTS_PER_PAGE,

            total:
              Number(
                paginationData.total
              ) || 0,

            totalPages:
              Number(
                paginationData
                  .totalPages
              ) || 0,

            hasNextPage:
              Boolean(
                paginationData
                  .hasNextPage
              ),

            hasPreviousPage:
              Boolean(
                paginationData
                  .hasPreviousPage
              ),
          });
        } catch (error) {
          console.error(
            "Products loading error:",
            error
          );

          if (cancelled) {
            return;
          }

          setProducts([]);

          setLoadError(
            error.response?.data
              ?.message ||
              "We couldn't load the collection right now. Please try again."
          );
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
  }, [
    page,
    debouncedSearch,
    selectedCategory,
    sortBy,
  ]);

  /*
   * ----------------------------------------
   * Filter handlers
   * ----------------------------------------
   */

  const handleCategoryChange = (
    event
  ) => {
    setSelectedCategory(
      event.target.value
    );

    /*
     * New filter means start
     * from page 1.
     */

    setPage(1);
  };

  const handleSortChange = (
    event
  ) => {
    setSortBy(
      event.target.value
    );

    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setSelectedCategory("");
    setSortBy("featured");
    setPage(1);
  };

  const hasFilters =
    Boolean(searchTerm) ||
    Boolean(
      selectedCategory
    ) ||
    sortBy !== "featured";

  /*
   * ----------------------------------------
   * Pagination handlers
   * ----------------------------------------
   */

  const goToPreviousPage =
    () => {
      if (
        loading ||
        !pagination
          .hasPreviousPage
      ) {
        return;
      }

      setPage((current) =>
        Math.max(
          current - 1,
          1
        )
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    };

  const goToNextPage = () => {
    if (
      loading ||
      !pagination.hasNextPage
    ) {
      return;
    }

    setPage((current) =>
      current + 1
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * ----------------------------------------
   * Render
   * ----------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      {/* --------------------------------
          Hero
      -------------------------------- */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Shop the collection
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
                Products worth

                <span className="block text-slate-400">
                  discovering.
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Explore our latest
                collection, compare
                available options, and
                choose the variant that
                fits you best.
              </p>
            </div>

            {!loading &&
              !loadError && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Collection
                  </p>

                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {
                      pagination.total
                    }

                    <span className="ml-1 text-sm font-medium text-slate-400">
                      {pagination.total ===
                      1
                        ? "product"
                        : "products"}
                    </span>
                  </p>
                </div>
              )}
          </div>
        </div>
      </section>

      {/* --------------------------------
          Product collection
      -------------------------------- */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Filters */}

        <div className="mb-8 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_12px_45px_rgba(15,23,42,0.035)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_210px_auto]">
            {/* Search */}

            <div className="relative">
              <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400" />

              <input
                type="search"
                value={searchTerm}
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
                placeholder="Search products or brands..."
                className="h-12 w-full rounded-2xl border border-transparent bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-slate-100 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100"
              />
            </div>

            {/* Category */}

            <div className="relative">
              <select
                value={
                  selectedCategory
                }
                onChange={
                  handleCategoryChange
                }
                className="h-12 w-full appearance-none rounded-2xl border border-transparent bg-slate-50 px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100"
              >
                <option value="">
                  All categories
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category._id ||
                        category.slug
                      }
                      value={
                        category.slug
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  )
                )}
              </select>

              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
            </div>

            {/* Sorting */}

            <div className="relative">
              <FaSlidersH className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

              <select
                value={sortBy}
                onChange={
                  handleSortChange
                }
                className="h-12 w-full appearance-none rounded-2xl border border-transparent bg-slate-50 pl-10 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:bg-slate-100 focus:border-slate-200 focus:bg-white focus:ring-4 focus:ring-slate-100"
              >
                <option value="featured">
                  Featured first
                </option>

                <option value="newest">
                  Newest
                </option>

                <option value="price-low">
                  Price: low to high
                </option>

                <option value="price-high">
                  Price: high to low
                </option>
              </select>

              <FaChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-400" />
            </div>

            {/* Clear Filters */}

            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
              >
                <FaTimes className="text-xs" />

                Clear
              </button>
            )}
          </div>
        </div>

        {/* --------------------------------
            Loading
        -------------------------------- */}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({
              length:
                PRODUCTS_PER_PAGE,
            }).map(
              (_, index) => (
                <ProductSkeleton
                  key={index}
                />
              )
            )}
          </div>
        ) : loadError ? (
          /* ------------------------------
             Error
          ------------------------------ */

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
              onClick={() =>
                window.location.reload()
              }
              className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : products.length ===
          0 ? (
          /* ------------------------------
             Empty results
          ------------------------------ */

          <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <FaSearch className="text-xl" />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-slate-950">
              No products found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try another search,
              choose a different
              category, or reset your
              filters.
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-6 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          /* ------------------------------
             Products
          ------------------------------ */

          <>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-900">
                  {products.length}
                </span>{" "}
                {products.length === 1
                  ? "product"
                  : "products"}

                {pagination.total >
                  products.length && (
                  <>
                    {" "}
                    of{" "}
                    <span className="font-semibold text-slate-900">
                      {
                        pagination.total
                      }
                    </span>
                  </>
                )}
              </p>

              {pagination.totalPages >
                1 && (
                <p className="text-xs font-medium text-slate-400">
                  Page{" "}
                  {
                    pagination.page
                  }{" "}
                  of{" "}
                  {
                    pagination.totalPages
                  }
                </p>
              )}
            </div>

            <motion.div
              key={`${page}-${debouncedSearch}-${selectedCategory}-${sortBy}`}
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},

                visible: {
                  transition: {
                    staggerChildren:
                      0.045,
                  },
                },
              }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {products.map(
                (product) => (
                  <motion.div
                    key={
                      product._id
                    }
                    variants={{
                      hidden: {
                        opacity: 0,
                        y: 12,
                      },

                      visible: {
                        opacity: 1,
                        y: 0,
                      },
                    }}
                  >
                    <ProductCard
                      product={
                        product
                      }
                    />
                  </motion.div>
                )
              )}
            </motion.div>
          </>
        )}

        {/* --------------------------------
            Pagination
        -------------------------------- */}

        {!loading &&
          !loadError &&
          products.length > 0 &&
          pagination.totalPages >
            1 && (
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-7 sm:flex-row">
              <p className="text-sm text-slate-500">
                Page{" "}
                <span className="font-semibold text-slate-900">
                  {
                    pagination.page
                  }
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-900">
                  {
                    pagination.totalPages
                  }
                </span>
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    loading ||
                    !pagination
                      .hasPreviousPage
                  }
                  onClick={
                    goToPreviousPage
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white">
                  {
                    pagination.page
                  }
                </div>

                <button
                  type="button"
                  disabled={
                    loading ||
                    !pagination
                      .hasNextPage
                  }
                  onClick={
                    goToNextPage
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
      </section>
    </main>
  );
};

export default ProductsPage;