import React, { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaBoxOpen,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaPhoneAlt,
  FaSearch,
  FaShoppingBag,
  FaSpinner,
  FaTruck,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, "");
const ASSET_BASE_URL = (
  import.meta.env.VITE_ASSET_URL || API_BASE_URL.replace(/\/api\/?$/, "")
).replace(/\/+$/, "");

const STATUS_STEPS = [
  { key: "pending", label: "Order placed", icon: FaClock },
  { key: "confirmed", label: "Confirmed", icon: FaCheckCircle },
  { key: "processing", label: "Processing", icon: FaBoxOpen },
  { key: "shipped", label: "Shipped", icon: FaTruck },
  { key: "delivered", label: "Delivered", icon: FaCheck },
];

const STATUS_RANK = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
};

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getImageUrl = (image) => {
  if (!image) return "https://placehold.co/180x180/f8fafc/94a3b8?text=ShopEase";
  const cleanPath = String(image).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  return `${ASSET_BASE_URL}/${cleanPath.replace(/^\/+/, "")}`;
};

const deliveryWindow = (delivery) => {
  const min = delivery?.estimatedDeliveryMinDays;
  const max = delivery?.estimatedDeliveryMaxDays;
  if (min && max) return min === max ? `${min} day${min === 1 ? "" : "s"}` : `${min}-${max} days`;
  if (min) return `${min}+ days`;
  if (max) return `Up to ${max} days`;
  return "Not provided yet";
};

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get("orderNumber") || "");
  const [contact, setContact] = useState("");
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const currentRank = useMemo(
    () => STATUS_RANK[order?.status] ?? -1,
    [order?.status]
  );

  const activeDelivery = useMemo(() => {
    const delivery = Array.isArray(order?.delivery) ? order.delivery : [];
    return delivery.find((entry) => entry.status !== "cancelled") || delivery[0] || null;
  }, [order?.delivery]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanOrderNumber = orderNumber.trim().toUpperCase();
    const cleanContact = contact.trim();

    if (!cleanOrderNumber || !cleanContact) {
      setError("Enter your order number and the email or phone used at checkout.");
      setOrder(null);
      return;
    }

    try {
      setTracking(true);
      setError("");
      setOrder(null);
      const response = await axios.post(`${API_BASE_URL}/orders/track`, {
        orderNumber: cleanOrderNumber,
        contact: cleanContact,
      });
      setOrder(response.data?.order || null);
      setOrderNumber(cleanOrderNumber);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "We couldn't track this order right now. Please try again."
      );
    } finally {
      setTracking(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fb] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
              <FaTruck className="text-[10px]" /> Order tracking
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
              See where your order stands.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
              Use your ShopEase order number together with the email address or phone number used at checkout.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <form onSubmit={handleSubmit} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.24)] sm:p-7">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Order number</label>
              <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="ORD-20260815-1234567890" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-800">Email or phone</label>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or 03001234567" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50" />
            </div>
            <button type="submit" disabled={tracking} className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-60">
              {tracking ? <><FaSpinner className="animate-spin" /> Tracking...</> : <><FaSearch /> Track order</>}
            </button>
          </div>
        </form>

        {error && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <FaExclamationTriangle className="mt-0.5 shrink-0" /> <p>{error}</p>
          </motion.div>
        )}

        {order && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-7 space-y-6">
            <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(15,23,42,0.22)]">
              <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Order</p>
                  <h2 className="mt-2 font-mono text-base font-bold sm:text-lg">{order.orderNumber}</h2>
                  <p className="mt-1 text-xs text-slate-400">Placed {formatDateTime(order.createdAt)}</p>
                </div>
                <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-bold ${order.status === "cancelled" ? "bg-red-50 text-red-700" : order.status === "delivered" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}>
                  <FaTruck /> {String(order.status || "pending").charAt(0).toUpperCase() + String(order.status || "pending").slice(1)}
                </span>
              </div>

              {order.status !== "cancelled" && (
                <div className="p-6 sm:p-7">
                  <div className="grid gap-5 sm:grid-cols-5">
                    {STATUS_STEPS.map((step, index) => {
                      const Icon = step.icon;
                      const completed = index <= currentRank;
                      const active = index === currentRank;
                      return (
                        <div key={step.key} className="relative">
                          <div className="relative z-10 flex items-center gap-3 sm:block">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${completed ? active ? "border-violet-600 bg-violet-600 text-white" : "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-white text-slate-300"}`}>
                              <Icon className="text-xs" />
                            </div>
                            <p className={`text-xs font-bold sm:mt-3 ${completed ? "text-slate-900" : "text-slate-400"}`}>{step.label}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {activeDelivery && (
              <section className="rounded-[30px] border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><FaTruck /></div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Delivery details</p>
                    <h3 className="mt-1 text-xl font-black">Your shipment information</h3>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Estimated delivery</p>
                    <p className="mt-2 font-bold text-slate-950">{deliveryWindow(activeDelivery)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Courier</p>
                    <p className="mt-2 font-bold text-slate-950">{activeDelivery.courierName || "Not assigned yet"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tracking ID</p>
                    <p className="mt-2 break-all font-mono text-sm font-bold text-slate-950">{activeDelivery.trackingId || "Not available yet"}</p>
                  </div>
                  <div className="rounded-2xl bg-white/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Last updated</p>
                    <p className="mt-2 text-sm font-bold text-slate-950">{formatDateTime(activeDelivery.lastUpdatedAt)}</p>
                  </div>
                </div>

                {(activeDelivery.riderName || activeDelivery.riderPhone) && (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-white p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><FaMotorcycle /></div>
                      <div>
                        <p className="text-sm font-bold">Delivery rider</p>
                        <p className="mt-1 text-sm text-slate-600">{activeDelivery.riderName || "Assigned rider"}</p>
                        {activeDelivery.riderPhone && (
                          <a href={`tel:${activeDelivery.riderPhone}`} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-emerald-700"><FaPhoneAlt className="text-xs" /> {activeDelivery.riderPhone}</a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-600">Order items</p>
                    <h3 className="mt-1 text-xl font-black">{order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}</h3>
                  </div>
                  <FaShoppingBag className="text-slate-300" />
                </div>
                <div className="mt-5 divide-y divide-slate-100">
                  {(order.items || []).map((item, index) => (
                    <div key={`${item.sku || item.productName}-${index}`} className="flex gap-4 py-5 first:pt-0 last:pb-0">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100"><img src={getImageUrl(item.image)} alt={item.productName} className="h-full w-full object-cover" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="truncate text-sm font-bold">{item.productName}</p><p className="mt-1 text-xs text-slate-400">{item.variantTitle || item.sku}</p></div>
                          <p className="shrink-0 text-sm font-bold">{formatPrice(item.subtotal)}</p>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">Quantity {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[28px] bg-slate-950 p-6 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300">Order summary</p>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between text-white/65"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                    <div className="flex justify-between text-white/65"><span>Delivery</span><span>{formatPrice(order.deliveryCharge)}</span></div>
                    <div className="flex justify-between border-t border-white/10 pt-4 text-base font-black"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                  </div>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><FaMapMarkerAlt /></div>
                    <div><p className="text-sm font-bold">Delivery destination</p><p className="mt-1 text-sm text-slate-500">{order.city}, {order.province}</p></div>
                  </div>
                </div>
              </div>
            </section>

            <Link to="/products" className="inline-flex w-fit items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white hover:bg-slate-800"><FaShoppingBag /> Continue shopping</Link>
          </motion.div>
        )}
      </section>
    </main>
  );
};

export default TrackOrderPage;
