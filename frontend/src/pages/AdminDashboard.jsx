import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../slices/authSlice.js";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArchive,
  FaArrowRight,
  FaBox,
  FaBoxOpen,
  FaCheckCircle,
  FaChartLine,
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

const normalizeCategories = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.categories)) return payload.categories;
  return [];
};

const getOrderItems = (order) => {
  if (Array.isArray(order?.items) && order.items.length > 0) return order.items;

  if (order?.product || order?.variantSnapshot) {
    return [
      {
        product: order.product,
        variant: order.variant,
        productSnapshot: { name: order.product?.name || "Product" },
        variantSnapshot: order.variantSnapshot,
        quantity: order.quantity || 1,
      },
    ];
  }

  return [];
};

const getOrderUnitCount = (order) =>
  getOrderItems(order).reduce(
    (sum, item) => sum + Math.max(1, Number(item?.quantity) || 1),
    0
  );

const getOrderSubtotal = (order) => Number(order?.subtotal || 0);

const getOrderDeliveryCharge = (order) =>
  Number(order?.deliveryCharge || 0);

const getOrderDiscount = (order) => Number(order?.discount || 0);

const getOrderPaymentLabel = (order) => {
  if (order?.paymentMethod === "jazzcash") return "JazzCash";
  if (order?.paymentMethod === "card") return "Card";
  return "Cash on Delivery";
};

const getOrderTotal = (order) => {
  const savedTotal = Number(order?.total);

  // New orders save total explicitly. For older orders that do not have
  // delivery fields yet, fall back safely to their historical subtotal.
  if (Number.isFinite(savedTotal) && savedTotal > 0) {
    return savedTotal;
  }

  return getOrderSubtotal(order) + getOrderDeliveryCharge(order);
};

const buildVariantSummary = (storefront = {}) => ({
  variantCount: Number(storefront?.variantCount || 0),
  minPrice:
    storefront?.minPrice === null ||
    storefront?.minPrice === undefined
      ? null
      : Number(storefront.minPrice),
  maxPrice:
    storefront?.maxPrice === null ||
    storefront?.maxPrice === undefined
      ? null
      : Number(storefront.maxPrice),
  totalStock: Number(storefront?.totalStock || 0),
  inStock: Boolean(storefront?.inStock),
});

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
  const dispatch = useDispatch();
  const { adminInfo } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  const [categoryModal, setCategoryModal] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryArchiveTarget, setCategoryArchiveTarget] = useState(null);
  const [categoryArchiving, setCategoryArchiving] = useState(false);

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
    fetchCategories();
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

      /*
       * Admin needs the complete catalog, not only active storefront items.
       * Fetch each status once, then use the storefront summary already
       * returned by GET /products. This removes the old per-product
       * /variants requests.
       */
      const statuses = ["active", "draft", "archived"];

      const responses = await Promise.all(
        statuses.map((status) =>
          axios.get(`${API_BASE_URL}/products/admin/catalog`, {
            params: {
              limit: 100,
              status,
              sort: "newest",
            },
            headers: authHeaders,
          })
        )
      );

      const productMap = new Map();

      responses.forEach((response) => {
        normalizeProducts(response.data).forEach((product) => {
          productMap.set(product._id, {
            ...product,
            variantSummary: buildVariantSummary(
              product.storefront || {}
            ),
          });
        });
      });

      const completeCatalog = [...productMap.values()].sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      setProducts(completeCatalog);
    } catch (error) {
      console.error("Admin products loading error:", error);

      if (error.response?.status === 401) {
        dispatch(logout());

        navigate("/admin/login", {
          replace: true,
        });

        return;
      }

      setLoadError(
        error.response?.data?.message ||
          "We couldn't load the product catalog."
      );

      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);

      const response = await axios.get(`${API_BASE_URL}/categories`);

      setCategories(
        normalizeCategories(response.data).sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        )
      );
    } catch (error) {
      console.error("Admin categories loading error:", error);
      setCategories([]);

      showNotice(
        "error",
        error.response?.data?.message ||
          "We couldn't load the categories."
      );
    } finally {
      setLoadingCategories(false);
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
        dispatch(logout());
        navigate("/admin/login", { replace: true });
        return;
      }

      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const stats = useMemo(() => {
    const orderValue = orders
      .filter((order) => order.status !== "cancelled")
      .reduce(
        (sum, order) => sum + getOrderTotal(order),
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
      categories: categories.length,
      totalOrders: orders.length,
      pendingOrders,
      orderValue,
    };
  }, [products, categories.length, orders]);

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

  const categoryUsageCounts = useMemo(() => {
    const counts = new Map();

    products.forEach((product) => {
      if (product.status === "archived") return;

      const categoryId =
        typeof product.category === "object"
          ? product.category?._id
          : null;

      if (!categoryId) return;

      counts.set(
        categoryId,
        (counts.get(categoryId) || 0) + 1
      );
    });

    return counts;
  }, [products]);

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((category) =>
      [
        category.name,
        category.slug,
        category.description,
      ]
        .filter(Boolean)
        .some((value) =>
          value.toString().toLowerCase().includes(query)
        )
    );
  }, [categories, searchTerm]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) =>
      [
        order.orderNumber,
        order.name,
        order.email,
        order.phoneNumber,
        order.product?.name,
        order.variant?.sku,
        order.variantSnapshot?.sku,
        ...getOrderItems(order).flatMap((item) => [
          item.product?.name,
          item.productSnapshot?.name,
          item.variant?.sku,
          item.variantSnapshot?.sku,
        ]),
        order.province,
        order.city,
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

  const openCreateCategory = () => {
    setCategoryModal({
      mode: "create",
      _id: "",
      name: "",
      description: "",
    });
  };

  const openEditCategory = (category) => {
    setCategoryModal({
      mode: "edit",
      _id: category._id,
      name: category.name || "",
      description: category.description || "",
    });
  };

  const saveCategory = async () => {
    if (!categoryModal || categorySaving) return;

    const name = categoryModal.name.trim();
    const description = categoryModal.description.trim();

    if (!name) {
      showNotice("error", "Category name is required.");
      return;
    }

    try {
      setCategorySaving(true);

      const response =
        categoryModal.mode === "edit"
          ? await axios.patch(
              `${API_BASE_URL}/categories/${categoryModal._id}`,
              {
                name,
                description,
              },
              {
                headers: authHeaders,
              }
            )
          : await axios.post(
              `${API_BASE_URL}/categories`,
              {
                name,
                description,
              },
              {
                headers: authHeaders,
              }
            );

      const savedCategory = response.data?.category;

      if (!savedCategory?._id) {
        throw new Error("Category was saved but no category was returned.");
      }

      setCategories((current) => {
        const exists = current.some(
          (category) => category._id === savedCategory._id
        );

        const next = exists
          ? current.map((category) =>
              category._id === savedCategory._id
                ? savedCategory
                : category
            )
          : [...current, savedCategory];

        return next.sort((a, b) =>
          String(a.name || "").localeCompare(String(b.name || ""))
        );
      });

      showNotice(
        "success",
        categoryModal.mode === "edit"
          ? "Category updated."
          : response.status === 200
            ? "Category restored."
            : "Category created."
      );

      setCategoryModal(null);
    } catch (error) {
      console.error("Save category error:", error);

      if (error.response?.status === 401) {
        dispatch(logout());
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      showNotice(
        "error",
        error.response?.data?.message ||
          error.message ||
          "Failed to save this category."
      );
    } finally {
      setCategorySaving(false);
    }
  };

  const archiveCategory = async () => {
    if (!categoryArchiveTarget?._id || categoryArchiving) return;

    try {
      setCategoryArchiving(true);

      await axios.delete(
        `${API_BASE_URL}/categories/${categoryArchiveTarget._id}`,
        {
          headers: authHeaders,
        }
      );

      setCategories((current) =>
        current.filter(
          (category) =>
            category._id !== categoryArchiveTarget._id
        )
      );

      showNotice(
        "success",
        `${categoryArchiveTarget.name} has been archived.`
      );

      setCategoryArchiveTarget(null);
    } catch (error) {
      console.error("Archive category error:", error);

      if (error.response?.status === 401) {
        dispatch(logout());
        navigate("/admin/login", {
          replace: true,
        });
        return;
      }

      showNotice(
        "error",
        error.response?.data?.message ||
          "Failed to archive this category."
      );
    } finally {
      setCategoryArchiving(false);
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
      : activeTab === "categories"
        ? loadingCategories
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
                to="/admin/analytics"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
              >
                <FaChartLine className="text-xs" />
                Analytics
              </Link>

              <Link
                to="/admin/reviews"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-semibold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
              >
                <FaCheckCircle className="text-xs" />
                Reviews
              </Link>

              <Link
                to="/admin/coupons"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                <FaTag className="text-xs" />
                Coupons
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
                  setActiveTab("categories");
                  setSearchTerm("");
                }}
                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-semibold transition ${
                  activeTab === "categories"
                    ? "text-slate-950"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <FaTag className="text-xs" />
                Categories
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  {stats.categories}
                </span>

                {activeTab === "categories" && (
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
                      : activeTab === "categories"
                        ? "Search categories..."
                        : "Search orders..."
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:bg-white focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="flex items-center gap-3">
                <p className="text-xs text-slate-400">
                  {activeTab === "products"
                    ? `${filteredProducts.length} catalog ${
                        filteredProducts.length === 1 ? "item" : "items"
                      }`
                    : activeTab === "categories"
                      ? `${filteredCategories.length} ${
                          filteredCategories.length === 1
                            ? "category"
                            : "categories"
                        }`
                      : `${filteredOrders.length} ${
                          filteredOrders.length === 1 ? "order" : "orders"
                        }`}
                </p>

                {activeTab === "categories" && (
                  <button
                    type="button"
                    onClick={openCreateCategory}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                  >
                    <FaPlus className="text-[10px]" />
                    Add category
                  </button>
                )}
              </div>
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
                          buildVariantSummary({});

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
                      buildVariantSummary({});

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
          ) : activeTab === "categories" ? (
            filteredCategories.length === 0 ? (
              <EmptyState
                icon={FaTag}
                title="No categories found"
                description={
                  searchTerm
                    ? "Try another search term."
                    : "Create a category before adding products to it."
                }
                action={
                  !searchTerm ? (
                    <button
                      type="button"
                      onClick={openCreateCategory}
                      className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
                    >
                      <FaPlus className="text-xs" />
                      Add category
                    </button>
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
                          Category
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Description
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Products
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Slug
                        </th>
                        <th className="px-6 py-3.5 text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredCategories.map((category) => {
                        const usageCount =
                          categoryUsageCounts.get(category._id) || 0;

                        return (
                          <tr
                            key={category._id}
                            className="transition hover:bg-slate-50/70"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                  <FaTag className="text-xs" />
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-slate-950">
                                    {category.name}
                                  </p>
                                  <p className="mt-1 text-[10px] text-emerald-600">
                                    Active
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-[360px] px-5 py-4 text-sm text-slate-500">
                              <p className="line-clamp-2">
                                {category.description ||
                                  "No description"}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {usageCount}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-mono text-xs text-slate-400">
                                {category.slug || "—"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditCategory(category)
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
                                  title="Edit category"
                                >
                                  <FaEdit className="text-xs" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setCategoryArchiveTarget(category)
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-100 text-red-500 transition hover:bg-red-50"
                                  title={
                                    usageCount > 0
                                      ? "Archive is blocked until products are moved or archived"
                                      : "Archive category"
                                  }
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
                  {filteredCategories.map((category) => {
                    const usageCount =
                      categoryUsageCounts.get(category._id) || 0;

                    return (
                      <div key={category._id} className="p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <FaTag className="text-xs" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-950">
                              {category.name}
                            </p>

                            <p className="mt-1 font-mono text-[10px] text-slate-400">
                              {category.slug || "No slug"}
                            </p>

                            <p className="mt-3 text-xs leading-5 text-slate-500">
                              {category.description ||
                                "No description"}
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                              <strong className="text-slate-700">
                                {usageCount}
                              </strong>{" "}
                              {usageCount === 1
                                ? "product"
                                : "products"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditCategory(category)
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700"
                          >
                            <FaEdit />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCategoryArchiveTarget(category)
                            }
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-xs font-semibold text-red-600"
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
                      const displayItems = getOrderItems(order);
                      const firstItem = displayItems[0];
                      const productName =
                        firstItem?.product?.name ||
                        firstItem?.productSnapshot?.name ||
                        order.product?.name ||
                        "Product unavailable";

                      const sku =
                        firstItem?.variant?.sku ||
                        firstItem?.variantSnapshot?.sku ||
                        order.variant?.sku ||
                        order.variantSnapshot?.sku ||
                        "";
                      const extraItemCount = Math.max(0, displayItems.length - 1);

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
                              {getOrderUnitCount(order)} total unit{getOrderUnitCount(order) === 1 ? "" : "s"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {order.name || "Customer"}
                            </p>
                            <p className="mt-1 max-w-[220px] truncate text-xs text-slate-400">
                              {order.email || order.phoneNumber || "—"}
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
                            {extraItemCount > 0 && (
                              <p className="mt-1 text-[10px] font-semibold text-violet-600">
                                +{extraItemCount} more cart {extraItemCount === 1 ? "item" : "items"}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-950">
                              {formatPrice(getOrderTotal(order))}
                            </p>

                            <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-400">
                              <p>
                                Subtotal {formatPrice(getOrderSubtotal(order))}
                              </p>

                              {getOrderDeliveryCharge(order) > 0 && (
                                <p>
                                  Delivery {formatPrice(getOrderDeliveryCharge(order))}
                                </p>
                              )}

                              {order.province && (
                                <p className="font-medium text-slate-500">
                                  {order.province}
                                </p>
                              )}
                            </div>
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
                  const displayItems = getOrderItems(order);
                  const firstItem = displayItems[0];
                  const productName =
                    firstItem?.product?.name ||
                    firstItem?.productSnapshot?.name ||
                    order.product?.name ||
                    "Product unavailable";

                  const sku =
                    firstItem?.variant?.sku ||
                    firstItem?.variantSnapshot?.sku ||
                    order.variant?.sku ||
                    order.variantSnapshot?.sku ||
                    "";
                  const extraItemCount = Math.max(0, displayItems.length - 1);

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
                              order.phoneNumber ||
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
                          {extraItemCount > 0 && (
                            <p className="mt-1 text-[10px] font-semibold text-violet-600">
                              +{extraItemCount} more cart {extraItemCount === 1 ? "item" : "items"}
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            Delivery
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {order.province || "Legacy order"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getOrderDeliveryCharge(order) > 0
                              ? formatPrice(getOrderDeliveryCharge(order))
                              : "No saved delivery charge"}
                          </p>
                          <p className="mt-1 text-[10px] font-semibold text-slate-400">
                            {getOrderPaymentLabel(order)} · {order.payment?.status || (order.paymentMethod === "jazzcash" ? "pending" : "unpaid")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">
                            Total
                          </p>
                          <p className="mt-1 text-lg font-semibold text-slate-950">
                            {formatPrice(getOrderTotal(order))}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {formatPrice(getOrderSubtotal(order))} subtotal
                            {getOrderDiscount(order) > 0
                              ? ` - ${formatPrice(getOrderDiscount(order))} discount`
                              : ""}
                            {getOrderDeliveryCharge(order) > 0
                              ? ` + ${formatPrice(getOrderDeliveryCharge(order))} delivery`
                              : ""}
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

      {categoryModal && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FaTag />
                </div>

                <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
                  {categoryModal.mode === "edit"
                    ? "Edit category"
                    : "Add category"}
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Categories organize products across the storefront.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setCategoryModal(null)}
                disabled={categorySaving}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
              >
                <FaTimes className="text-xs" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Category name
                </label>

                <input
                  value={categoryModal.name}
                  onChange={(event) =>
                    setCategoryModal((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  maxLength={120}
                  autoFocus
                  placeholder="e.g. Electronics"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  value={categoryModal.description}
                  onChange={(event) =>
                    setCategoryModal((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="What kind of products belong in this category?"
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCategoryModal(null)}
                disabled={categorySaving}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveCategory}
                disabled={categorySaving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
              >
                {categorySaving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheckCircle />
                    {categoryModal.mode === "edit"
                      ? "Save changes"
                      : "Create category"}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {categoryArchiveTarget && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              y: 10,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <FaArchive />
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight text-slate-950">
              Archive this category?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-semibold text-slate-700">
                {categoryArchiveTarget.name}
              </span>{" "}
              will disappear from category selectors. The backend will block
              this action if any non-archived product still uses it.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setCategoryArchiveTarget(null)
                }
                disabled={categoryArchiving}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={archiveCategory}
                disabled={categoryArchiving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-wait disabled:opacity-60"
              >
                {categoryArchiving ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Archiving...
                  </>
                ) : (
                  <>
                    <FaArchive />
                    Archive category
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

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