import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router";
import { useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArchive,
  FaArrowRight,
  FaBox,
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaExclamationTriangle,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaShoppingBag,
  FaSpinner,
  FaStore,
  FaTag,
  FaTimes,
  FaTimesCircle,
  FaTruck,
  FaWallet,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

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
    return "https://placehold.co/600x600/f8fafc/94a3b8?text=ShopEase";
  }

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;

  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const getCategoryName = (category) => {
  if (!category) return "Uncategorized";
  return typeof category === "string"
    ? category
    : category.name || "Uncategorized";
};

const normalizeProducts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  return [];
};

const normalizeOrders = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
};

const normalizeVariants = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.variants)) return payload.variants;
  return [];
};

const buildVariantSummary = (variants) => {
  const activeVariants = variants.filter(
    (variant) => variant?.isActive !== false
  );

  const prices = activeVariants
    .map((variant) => Number(variant?.price))
    .filter((price) => Number.isFinite(price));

  const totalStock = activeVariants.reduce(
    (sum, variant) => sum + Number(variant?.stock || 0),
    0
  );

  return {
    variants: activeVariants,
    variantCount: activeVariants.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    totalStock,
    inStock: totalStock > 0,
  };
};

const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      label: "Pending",
      icon: FaClock,
      className: "bg-amber-50 text-amber-700 ring-amber-100",
    },
    confirmed: {
      label: "Confirmed",
      icon: FaCheckCircle,
      className: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    processing: {
      label: "Processing",
      icon: FaSpinner,
      className: "bg-violet-50 text-violet-700 ring-violet-100",
    },
    shipped: {
      label: "Shipped",
      icon: FaTruck,
      className: "bg-indigo-50 text-indigo-700 ring-indigo-100",
    },
    delivered: {
      label: "Delivered",
      icon: FaCheckCircle,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    },
    cancelled: {
      label: "Cancelled",
      icon: FaTimesCircle,
      className: "bg-red-50 text-red-700 ring-red-100",
    },
  };

  const selected = config[status] || config.pending;
  const Icon = selected.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${selected.className}`}
    >
      <Icon className={status === "processing" ? "animate-spin" : ""} />
      {selected.label}
    </span>
  );
};

const ProductStatusBadge = ({ status }) => {
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : status === "draft"
            ? "bg-amber-50 text-amber-700 ring-amber-100"
            : "bg-slate-100 text-slate-500 ring-slate-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active
            ? "bg-emerald-500"
            : status === "draft"
              ? "bg-amber-500"
              : "bg-slate-400"
        }`}
      />
      {status
        ? `${status.charAt(0).toUpperCase()}${status.slice(1)}`
        : "Unknown"}
    </span>
  );
};

const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="px-6 py-16 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
      <Icon className="text-xl" />
    </div>
    <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
      {description}
    </p>
    {action}
  </div>
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const [notice, setNotice] = useState(null);
  const [loadError, setLoadError] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${adminInfo?.token || ""}`,
    }),
    [adminInfo?.token]
  );

  useEffect(() => {
    if (!adminInfo?.token) {
      navigate("/admin/login", { replace: true });
    }
  }, [adminInfo?.token, navigate]);

  useEffect(() => {
    if (!adminInfo?.token) return;

    fetchProducts();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminInfo?.token]);

  const showNotice = (type, message) => {
    setNotice({ type, message });

    window.setTimeout(() => {
      setNotice(null);
    }, 3500);
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setLoadError("");

      const response = await axios.get(`${API_BASE_URL}/products`, {
        params: {
          limit: 100,
        },
      });

      const productList = normalizeProducts(response.data);

      const enrichedProducts = await Promise.all(
        productList.map(async (product) => {
          try {
            const variantResponse = await axios.get(
              `${API_BASE_URL}/products/${product._id}/variants`
            );

            return {
              ...product,
              variantSummary: buildVariantSummary(
                normalizeVariants(variantResponse.data)
              ),
            };
          } catch (error) {
            console.warn(
              `Could not load variants for product ${product._id}:`,
              error
            );

            return {
              ...product,
              variantSummary: buildVariantSummary([]),
            };
          }
        })
      );

      setProducts(enrichedProducts);
    } catch (error) {
      console.error("Admin products loading error:", error);

      setLoadError(
        error.response?.data?.message ||
          "We couldn't load the product catalog."
      );
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);

      const response = await axios.get(`${API_BASE_URL}/orders`, {
        headers: authHeaders,
      });

      setOrders(normalizeOrders(response.data));
    } catch (error) {
      console.error("Admin orders loading error:", error);

      if (error.response?.status === 401) {
        navigate("/admin/login", { replace: true });
        return;
      }

      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const stats = useMemo(() => {
    const categoryKeys = new Set(
      products
        .map((product) => {
          if (!product.category) return null;

          if (typeof product.category === "string") {
            return product.category;
          }

          return (
            product.category._id ||
            product.category.slug ||
            product.category.name
          );
        })
        .filter(Boolean)
    );

    const orderValue = orders
      .filter((order) => order.status !== "cancelled")
      .reduce(
        (sum, order) => sum + Number(order.subtotal || 0),
        0
      );

    const pendingOrders = orders.filter(
      (order) => order.status === "pending"
    ).length;

    return {
      totalProducts: products.length,
      activeProducts: products.filter(
        (product) => product.status === "active"
      ).length,
      categories: categoryKeys.size,
      totalOrders: orders.length,
      pendingOrders,
      orderValue,
    };
  }, [products, orders]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      [
        product.name,
        product.brand,
        getCategoryName(product.category),
        product.status,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toString().toLowerCase().includes(query)
        )
    );
  }, [products, searchTerm]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) =>
      [
        order.orderNumber,
        order.name,
        order.email,
        order.phone,
        order.product?.name,
        order.variant?.sku,
        order.variantSnapshot?.sku,
        order.status,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toString().toLowerCase().includes(query)
        )
    );
  }, [orders, searchTerm]);

  const handleArchiveProduct = async () => {
    if (!archiveTarget?._id || archiving) return;

    try {
      setArchiving(true);

      await axios.delete(
        `${API_BASE_URL}/products/${archiveTarget._id}`,
        {
          headers: authHeaders,
        }
      );

      setProducts((current) =>
        current.map((product) =>
          product._id === archiveTarget._id
            ? { ...product, status: "archived" }
            : product
        )
      );

      showNotice(
        "success",
        `${archiveTarget.name} has been archived.`
      );

      setArchiveTarget(null);
    } catch (error) {
      console.error("Archive product error:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Failed to archive this product."
      );
    } finally {
      setArchiving(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    if (!orderId || !status || updatingOrderId) return;

    try {
      setUpdatingOrderId(orderId);

      const response = await axios.put(
        `${API_BASE_URL}/orders/${orderId}/status`,
        { status },
        {
          headers: authHeaders,
        }
      );

      const updatedOrder =
        response.data?.order ||
        response.data;

      setOrders((current) =>
        current.map((order) =>
          order._id === orderId
            ? {
                ...order,
                ...(updatedOrder?._id ? updatedOrder : {}),
                status,
              }
            : order
        )
      );

      showNotice(
        "success",
        `Order status updated to ${status}.`
      );
    } catch (error) {
      console.error("Order status update error:", error);

      showNotice(
        "error",
        error.response?.data?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (!adminInfo?.token) {
    return null;
  }

  const isLoading =
    activeTab === "products"
      ? loadingProducts
      : loadingOrders;

  return (
    <main className="min-h-screen bg-[#f5f6f8]">
      {notice && (
        <div className="fixed right-4 top-24 z-[70] w-[calc(100%-2rem)] max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-[0_20px_60px_rgba(15,23,42,0.14)] ${
              notice.type === "success"
                ? "border-emerald-100 bg-white text-emerald-700"
                : "border-red-100 bg-white text-red-700"
            }`}
          >
            {notice.type === "success" ? (
              <FaCheckCircle className="mt-0.5 shrink-0" />
            ) : (
              <FaExclamationTriangle className="mt-0.5 shrink-0" />
            )}

            <p className="flex-1 text-sm font-medium leading-5">
              {notice.message}
            </p>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-slate-300 transition hover:text-slate-700"
              aria-label="Dismiss notification"
            >
              <FaTimes className="text-xs" />
            </button>
          </motion.div>
        </div>
      )}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700">
                <FaStore className="text-[9px]" />
                ShopEase admin
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Commerce dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage products, monitor orders, and keep the storefront
                inventory up to date.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                View storefront
                <FaArrowRight className="text-[9px]" />
              </Link>

              <Link
                to="/admin/products/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <FaPlus className="text-xs" />
                Add product
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Products",
              value: stats.totalProducts,
              detail: `${stats.activeProducts} active`,
              icon: FaBoxOpen,
              iconClass: "bg-violet-50 text-violet-600",
            },
            {
              label: "Categories",
              value: stats.categories,
              detail: "Across catalog",
              icon: FaTag,
              iconClass: "bg-blue-50 text-blue-600",
            },
            {
              label: "Orders",
              value: stats.totalOrders,
              detail: `${stats.pendingOrders} awaiting action`,
              icon: FaShoppingBag,
              iconClass: "bg-amber-50 text-amber-600",
            },
            {
              label: "Order value",
              value: formatPrice(stats.orderValue),
              detail: "Excluding cancelled",
              icon: FaWallet,
              iconClass: "bg-emerald-50 text-emerald-600",
              compact: true,
            },
          ].map(
            ({
              label,
              value,
              detail,
              icon: Icon,
              iconClass,
              compact,
            }) => (
              <div
                key={label}
                className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.025)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      {label}
                    </p>
                    <p
                      className={`mt-2 font-semibold tracking-[-0.035em] text-slate-950 ${
                        compact
                          ? "text-xl sm:text-2xl"
                          : "text-3xl"
                      }`}
                    >
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {detail}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
                  >
                    <Icon />
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.035)]">
          <div className="border-b border-slate-200 px-4 sm:px-6">
            <div className="flex min-w-max gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("products");
                  setSearchTerm("");
                }}
                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-semibold transition ${
                  activeTab === "products"
                    ? "text-slate-950"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <FaBoxOpen className="text-xs" />
                Products
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {stats.totalProducts}
                </span>

                {activeTab === "products" && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("orders");
                  setSearchTerm("");
                }}
                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-semibold transition ${
                  activeTab === "orders"
                    ? "text-slate-950"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <FaShoppingBag className="text-xs" />
                Orders
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {stats.totalOrders}
                </span>

                {activeTab === "orders" && (
                  <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
                )}
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder={
                    activeTab === "products"
                      ? "Search products..."
                      : "Search orders..."
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <p className="text-xs text-slate-400">
                {activeTab === "products"
                  ? `${filteredProducts.length} catalog ${
                      filteredProducts.length === 1 ? "item" : "items"
                    }`
                  : `${filteredOrders.length} ${
                      filteredOrders.length === 1 ? "order" : "orders"
                    }`}
              </p>
            </div>
          </div>

          {loadError && activeTab === "products" && (
            <div className="mx-4 mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 sm:mx-5">
              {loadError}
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <div className="text-center">
                <FaSpinner className="mx-auto animate-spin text-2xl text-violet-600" />
                <p className="mt-3 text-sm text-slate-400">
                  Loading {activeTab}...
                </p>
              </div>
            </div>
          ) : activeTab === "products" ? (
            filteredProducts.length === 0 ? (
              <EmptyState
                icon={FaBoxOpen}
                title="No products found"
                description={
                  searchTerm
                    ? "Try another search term."
                    : "Create your first product to start building the catalog."
                }
                action={
                  !searchTerm ? (
                    <Link
                      to="/admin/products/new"
                      className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                    >
                      <FaPlus className="text-xs" />
                      Add product
                    </Link>
                  ) : null
                }
              />
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                        <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Product
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Category
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Variants
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Price
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Stock
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Status
                        </th>
                        <th className="px-6 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((product) => {
                        const summary =
                          product.variantSummary ||
                          buildVariantSummary([]);

                        const image = product.images?.[0];

                        return (
                          <tr
                            key={product._id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                  <img
                                    src={getImageUrl(image)}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p className="max-w-[240px] truncate text-sm font-semibold text-slate-950">
                                    {product.name}
                                  </p>
                                  <p className="mt-1 max-w-[240px] truncate text-xs text-slate-400">
                                    {product.brand ||
                                      product.slug ||
                                      "No brand"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {getCategoryName(product.category)}
                            </td>

                            <td className="px-5 py-4">
                              <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                <FaLayerGroup className="text-[10px] text-slate-400" />
                                {summary.variantCount}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              {summary.minPrice !== null ? (
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {formatPrice(summary.minPrice)}
                                  </p>
                                  {summary.maxPrice !== null &&
                                    summary.maxPrice >
                                      summary.minPrice && (
                                      <p className="mt-0.5 text-[10px] text-slate-400">
                                        up to{" "}
                                        {formatPrice(
                                          summary.maxPrice
                                        )}
                                      </p>
                                    )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  No variants
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`text-sm font-semibold ${
                                  summary.totalStock > 0
                                    ? "text-slate-900"
                                    : "text-red-500"
                                }`}
                              >
                                {summary.totalStock}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <ProductStatusBadge
                                status={product.status}
                              />
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/admin/products/edit/${product._id}`}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                                  title="Edit product"
                                >
                                  <FaEdit className="text-xs" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setArchiveTarget(product)
                                  }
                                  disabled={
                                    product.status === "archived"
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                                  title="Archive product"
                                >
                                  <FaArchive className="text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-100 lg:hidden">
                  {filteredProducts.map((product) => {
                    const summary =
                      product.variantSummary ||
                      buildVariantSummary([]);

                    return (
                      <div key={product._id} className="p-4 sm:p-5">
                        <div className="flex gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                            <img
                              src={getImageUrl(product.images?.[0])}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950">
                                  {product.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {getCategoryName(
                                    product.category
                                  )}
                                </p>
                              </div>
                              <ProductStatusBadge
                                status={product.status}
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                              <span>
                                {summary.variantCount} variants
                              </span>
                              <span>{summary.totalStock} stock</span>
                              <span className="font-semibold text-slate-800">
                                {summary.minPrice !== null
                                  ? formatPrice(summary.minPrice)
                                  : "No price"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Link
                            to={`/admin/products/edit/${product._id}`}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700"
                          >
                            <FaEdit />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() =>
                              setArchiveTarget(product)
                            }
                            disabled={
                              product.status === "archived"
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-xs font-semibold text-red-600 disabled:opacity-30"
                          >
                            <FaArchive />
                            Archive
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              icon={FaShoppingBag}
              title="No orders found"
              description={
                searchTerm
                  ? "Try another search term."
                  : "Customer orders will appear here when they are placed."
              }
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-left">
                      <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Order
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Customer
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Product
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Total
                      </th>
                      <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => {
                      const productName =
                        order.product?.name ||
                        "Product unavailable";

                      const sku =
                        order.variant?.sku ||
                        order.variantSnapshot?.sku ||
                        "";

                      return (
                        <tr
                          key={order._id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4">
                            <p className="font-mono text-xs font-semibold text-slate-800">
                              {order.orderNumber ||
                                `#${order._id
                                  ?.slice(-8)
                                  ?.toUpperCase()}`}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Qty {order.quantity || 1}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {order.name || "Customer"}
                            </p>
                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                              {order.email || order.phone || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">
                              {productName}
                            </p>
                            {sku && (
                              <p className="mt-1 font-mono text-[10px] text-slate-400">
                                {sku}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                            {formatPrice(order.subtotal)}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(order.createdAt)}
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <StatusBadge
                                status={order.status}
                              />

                              <div className="relative">
                                <select
                                  value={
                                    order.status || "pending"
                                  }
                                  onChange={(event) =>
                                    updateOrderStatus(
                                      order._id,
                                      event.target.value
                                    )
                                  }
                                  disabled={
                                    updatingOrderId === order._id
                                  }
                                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-slate-400 disabled:cursor-wait disabled:opacity-50"
                                >
                                  {ORDER_STATUSES.map(
                                    (status) => (
                                      <option
                                        key={status}
                                        value={status}
                                      >
                                        {status
                                          .charAt(0)
                                          .toUpperCase() +
                                          status.slice(1)}
                                      </option>
                                    )
                                  )}
                                </select>

                                {updatingOrderId ===
                                  order._id && (
                                  <FaSpinner className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-[10px] text-violet-600" />
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 xl:hidden">
                {filteredOrders.map((order) => {
                  const productName =
                    order.product?.name ||
                    "Product unavailable";

                  const sku =
                    order.variant?.sku ||
                    order.variantSnapshot?.sku ||
                    "";

                  return (
                    <div key={order._id} className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-xs font-semibold text-slate-800">
                            {order.orderNumber ||
                              `#${order._id
                                ?.slice(-8)
                                ?.toUpperCase()}`}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <StatusBadge status={order.status} />
                      </div>

                      <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            Customer
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {order.name || "Customer"}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {order.email ||
                              order.phone ||
                              "No contact"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            Product
                          </p>
                          <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                            {productName}
                          </p>
                          {sku && (
                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                              {sku}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">
                            Total
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-950">
                            {formatPrice(order.subtotal)}
                          </p>
                        </div>

                        <select
                          value={order.status || "pending"}
                          onChange={(event) =>
                            updateOrderStatus(
                              order._id,
                              event.target.value
                            )
                          }
                          disabled={
                            updatingOrderId === order._id
                          }
                          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() +
                                status.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {archiveTarget && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <FaArchive />
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
              Archive this product?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-semibold text-slate-700">
                {archiveTarget.name}
              </span>{" "}
              will be removed from the active storefront catalog. This uses
              your backend's archive behavior rather than permanently deleting
              the record.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                disabled={archiving}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleArchiveProduct}
                disabled={archiving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {archiving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <FaArchive />
                    Archive product
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;