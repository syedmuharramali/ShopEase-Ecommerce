import React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCompass,
  FaHome,
  FaShoppingBag,
} from "react-icons/fa";

const NotFound = () => {
  return (
    <main className="relative flex min-h-[70vh] items-center overflow-hidden bg-[#f7f7f5] px-4 py-16 sm:px-6 lg:px-8">
      <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <FaCompass />
            Page not found
          </div>

          <p className="mt-7 bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-7xl font-semibold tracking-[-0.07em] text-transparent sm:text-8xl">
            404
          </p>

          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
            This page wandered
            <span className="block text-slate-400">
              out of the collection.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
            The address may have changed, or the page may no longer exist.
            Continue shopping or return to the ShopEase homepage.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              <FaShoppingBag />
              Browse products
              <FaArrowRight className="text-[9px]" />
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <FaHome />
              Back home
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, rotate: 2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.08 }}
          className="relative mx-auto hidden aspect-square w-full max-w-[420px] lg:block"
        >
          <div className="absolute inset-[7%] rotate-6 rounded-[44px] bg-gradient-to-br from-violet-200 via-purple-100 to-blue-200" />
          <div className="absolute inset-[14%] -rotate-3 rounded-[38px] border border-white bg-white/80 shadow-[0_30px_90px_rgba(15,23,42,0.10)] backdrop-blur">
            <div className="flex h-full flex-col items-center justify-center p-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-slate-950 text-3xl text-white">
                <FaCompass />
              </div>

              <p className="mt-6 text-lg font-semibold text-slate-950">
                Nothing to see here.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                But there are plenty of products waiting in the collection.
              </p>

              <Link
                to="/products"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-600"
              >
                Find your way back
                <FaArrowLeft className="rotate-180 text-[9px]" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
};

export default NotFound;