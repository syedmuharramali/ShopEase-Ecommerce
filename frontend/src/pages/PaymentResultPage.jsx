import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaShoppingBag,
  FaTruck,
} from "react-icons/fa";
import { useStore } from "../context/storeContext.jsx";

const PaymentResultPage = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useStore();
  const status = searchParams.get("status") === "success" ? "success" : "failed";
  const orderNumber = searchParams.get("orderNumber") || "";

  useEffect(() => {
    if (status === "success") clearCart();
  }, [clearCart, status]);

  const success = status === "success";

  return (
    <main className="min-h-[76vh] bg-[#f7f7f5] px-4 py-16 sm:px-6 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.09)]"
      >
        <div className={`${success ? "bg-slate-950" : "bg-rose-950"} px-6 py-10 text-center text-white sm:px-10`}>
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${success ? "bg-emerald-500" : "bg-rose-500"}`}>
            {success ? <FaCheckCircle className="text-2xl" /> : <FaExclamationTriangle className="text-2xl" />}
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
            JazzCash payment
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            {success ? "Payment received." : "Payment was not completed."}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/65">
            {success
              ? "Your payment was verified by the server and your ShopEase order is confirmed."
              : "The reserved order was cancelled and inventory was released. You can return to the shop and try again."}
          </p>
        </div>

        <div className="p-6 sm:p-10">
          {orderNumber && (
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Order number</span>
                <span className="font-mono text-sm font-semibold text-slate-950">{orderNumber}</span>
              </div>
            </div>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white">
              <FaShoppingBag /> Shop
            </Link>
            {success && orderNumber ? (
              <Link to={`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-sm font-semibold text-violet-700">
                <FaTruck /> Track order
              </Link>
            ) : (
              <Link to="/cart" className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-sm font-semibold text-violet-700">Return to cart</Link>
            )}
            <Link to="/" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700">Home</Link>
          </div>
        </div>
      </motion.div>
    </main>
  );
};

export default PaymentResultPage;