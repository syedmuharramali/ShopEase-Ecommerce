import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaChartBar,
  FaChartLine,
  FaClock,
  FaExclamationTriangle,
  FaShoppingBag,
  FaSpinner,
  FaStore,
  FaTruck,
  FaWallet,
} from "react-icons/fa";
import { logout } from "../slices/authSlice.js";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const paymentLabel = (value) => {
  if (value === "jazzcash") return "JazzCash";
  if (value === "card") return "Card";
  return "Cash on Delivery";
};

const statusClass = (status) => {
  const classes = {
    pending: "bg-amber-50 text-amber-700",
    confirmed: "bg-blue-50 text-blue-700",
    processing: "bg-violet-50 text-violet-700",
    shipped: "bg-indigo-50 text-indigo-700",
    delivered: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-red-50 text-red-700",
  };

  return classes[status] || "bg-slate-100 text-slate-600";
};

const AdminAnalyticsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminInfo } = useSelector((state) => state.auth);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${adminInfo?.token || ""}`,
    }),
    [adminInfo?.token]
  );

  useEffect(() => {
    if (!adminInfo?.token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    let cancelled = false;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await axios.get(`${API_BASE_URL}/admin/analytics`, {
          params: { lowStockThreshold: 5 },
          headers: authHeaders,
        });

        if (!cancelled) {
          setData(response.data);
        }
      } catch (requestError) {
        console.error("Analytics loading error:", requestError);

        if (cancelled) return;

        if (requestError.response?.status === 401) {
          dispatch(logout());
          navigate("/admin/login", { replace: true });
          return;
        }

        setError(
          requestError.response?.data?.message ||
            "We couldn't load analytics right now."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      cancelled = true;
    };
  }, [adminInfo?.token, authHeaders, dispatch, navigate]);

  const monthlyMax = useMemo(
    () =>
      Math.max(
        1,
        ...(data?.monthlySales || []).map((item) => Number(item.sales || 0))
      ),
    [data?.monthlySales]
  );

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f6f6f4] px-4">
        <div className="text-center">
          <FaSpinner className="mx-auto animate-spin text-2xl text-violet-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Loading commerce analytics...
          </p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-[70vh] bg-[#f6f6f4] px-4 py-20">
        <div className="mx-auto max-w-lg rounded-[30px] border border-red-100 bg-white p-8 text-center">
          <FaExclamationTriangle className="mx-auto text-2xl text-red-500" />
          <h1 className="mt-4 text-xl font-black text-slate-950">
            Analytics unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{error}</p>
          <Link
            to="/admin/dashboard"
            className="mt-6 inline-flex rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  const summary = data.summary || {};
  const statuses = data.orderStatuses || {};

  const cards = [
    {
      label: "Sales value",
      value: formatPrice(summary.salesValue),
      detail: "Non-cancelled orders",
      icon: FaWallet,
      className: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Orders",
      value: summary.totalOrders || 0,
      detail: `${statuses.pending || 0} awaiting action`,
      icon: FaShoppingBag,
      className: "bg-violet-50 text-violet-600",
    },
    {
      label: "Avg. order value",
      value: formatPrice(summary.averageOrderValue),
      detail: "Across non-cancelled orders",
      icon: FaChartLine,
      className: "bg-blue-50 text-blue-600",
    },
    {
      label: "Inventory alerts",
      value:
        Number(summary.lowStockVariants || 0) +
        Number(summary.outOfStockVariants || 0),
      detail: `${summary.outOfStockVariants || 0} out of stock`,
      icon: FaExclamationTriangle,
      className: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f6f6f4]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-950"
          >
            <FaArrowLeft className="text-[10px]" />
            Commerce dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">
                <FaChartBar />
                Store intelligence
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Commerce analytics
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Sales, orders, best sellers and inventory warnings in one
                operational view.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              <FaStore />
              View storefront
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, detail, icon: Icon, className }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.035)]"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${className}`}
              >
                <Icon />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.13em] text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                {value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{detail}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.035)] sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                  Last 6 months
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  Sales trend
                </h2>
              </div>
              <FaChartLine className="text-xl text-violet-500" />
            </div>

            <div className="mt-8 flex h-64 items-end gap-3 sm:gap-5">
              {(data.monthlySales || []).map((item) => {
                const percentage =
                  (Number(item.sales || 0) / monthlyMax) * 100;

                return (
                  <div
                    key={item.key}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end"
                  >
                    <p className="mb-2 hidden text-[10px] font-bold text-slate-500 sm:block">
                      {formatPrice(item.sales)}
                    </p>
                    <div className="flex h-44 w-full items-end rounded-[18px] bg-slate-50 p-1.5">
                      <div
                        className="w-full rounded-[13px] bg-gradient-to-t from-violet-600 to-blue-500 transition-all"
                        style={{
                          height: `${Math.max(
                            Number(item.sales || 0) > 0 ? 10 : 3,
                            percentage
                          )}%`,
                        }}
                        title={`${item.label}: ${formatPrice(item.sales)}`}
                      />
                    </div>
                    <p className="mt-3 truncate text-[10px] font-bold text-slate-400">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_12px_40px_rgba(15,23,42,0.08)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
              Order pipeline
            </p>
            <h2 className="mt-2 text-xl font-black">Current statuses</h2>

            <div className="mt-7 space-y-3">
              {Object.entries(statuses).map(([status, count]) => {
                const total = Math.max(1, Number(summary.totalOrders || 0));
                const width = (Number(count || 0) / total) * 100;

                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold capitalize text-white/65">
                        {status}
                      </span>
                      <span className="font-black">{count}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-400"
                        style={{ width: `${Math.max(width, count ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.035)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Best sellers
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Top products
                  </h2>
                </div>
                <FaShoppingBag className="text-slate-300" />
              </div>
            </div>

            {(data.topProducts || []).length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Sales data will appear after orders are created.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.topProducts.map((product, index) => (
                  <div
                    key={String(product.productId || index)}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950">
                        {product.name || "Product"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {product.unitsSold} unit
                        {Number(product.unitsSold) === 1 ? "" : "s"} sold
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-black text-slate-700">
                      {formatPrice(product.sales)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.035)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600">
                    Inventory watch
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Low stock variants
                  </h2>
                </div>
                <FaExclamationTriangle className="text-amber-500" />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Alert threshold: {data.lowStockThreshold} units.
              </p>
            </div>

            {(data.lowStock || []).length === 0 ? (
              <div className="px-6 py-12 text-center">
                <FaBoxOpen className="mx-auto text-2xl text-emerald-400" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  Inventory looks healthy.
                </p>
              </div>
            ) : (
              <div className="max-h-[430px] divide-y divide-slate-100 overflow-y-auto">
                {data.lowStock.map((variant) => (
                  <div
                    key={variant._id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        Number(variant.stock) <= 0
                          ? "bg-red-50 text-red-600"
                          : "bg-amber-50 text-amber-600"
                      }`}
                    >
                      {variant.stock}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-slate-950">
                        {variant.product?.name || "Product"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {variant.title || variant.sku}
                        {variant.title && variant.sku
                          ? ` · ${variant.sku}`
                          : ""}
                      </p>
                    </div>

                    {variant.product?._id && (
                      <Link
                        to={`/admin/products/edit/${variant.product._id}`}
                        className="shrink-0 text-xs font-black text-violet-600 hover:text-violet-700"
                      >
                        Restock
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.035)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
                    Latest activity
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    Recent orders
                  </h2>
                </div>
                <FaClock className="text-slate-300" />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {(data.recentOrders || []).map((order) => (
                <div
                  key={order._id}
                  className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs font-black text-slate-950">
                      {order.orderNumber || "Order"}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {order.name} · {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-black capitalize ${statusClass(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>

                  <p className="text-sm font-black text-slate-700">
                    {formatPrice(order.total || order.subtotal)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.035)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-600">
              Payment mix
            </p>
            <h2 className="mt-2 text-xl font-black text-slate-950">
              How customers pay
            </h2>

            <div className="mt-6 space-y-3">
              {(data.paymentMethods || []).map((item) => (
                <div
                  key={item.method}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-900">
                      {paymentLabel(item.method)}
                    </p>
                    <p className="text-xs font-black text-slate-500">
                      {item.orders} order{Number(item.orders) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-black text-violet-600">
                    {formatPrice(item.sales)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[20px] bg-slate-950 p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
                Catalog
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xl font-black">
                    {summary.activeProducts || 0}
                  </p>
                  <p className="text-[11px] text-white/45">Active products</p>
                </div>
                <div>
                  <p className="text-xl font-black">
                    {summary.activeVariants || 0}
                  </p>
                  <p className="text-[11px] text-white/45">Active variants</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default AdminAnalyticsPage;