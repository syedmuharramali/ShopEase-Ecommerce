import React  from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";

const developerPhoto =
  "https://res.cloudinary.com/uxbmj8cq/image/upload/f_auto,q_auto:best,c_limit,w_900/v1787179082/developerProfileOptimized.webp";

import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaCode,
  FaDatabase,
  FaGithub,
  FaLayerGroup,
  FaLinkedinIn,
  FaLock,
  FaNodeJs,
  FaReact,
  FaServer,
  FaShieldAlt,
  FaShoppingBag,
  FaStar,
  FaStore,
  FaTruck,
} from "react-icons/fa";
import { useEffect } from "react";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/syedmuharramali/";

const GITHUB_URL =
  "https://github.com/syedmuharramali";

const PROJECT_REPO =
  "https://github.com/syedmuharramali/ShopEase-Ecommerce";

const reveal = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const stack = [
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "Mongoose",
  "Redux Toolkit",
  "Tailwind CSS",
  "REST APIs",
  "JWT",
  "Vite",
];

const capabilities = [
  {
    number: "01",
    icon: FaLayerGroup,
    title: "Variant-first catalog",
    description:
      "Product options map to real purchasable variants with independent SKU, price, stock and images.",
  },
  {
    number: "02",
    icon: FaShoppingBag,
    title: "Cart & checkout",
    description:
      "Anonymous persistent cart, Buy Now and multi-item checkout with backend-authoritative totals.",
  },
  {
    number: "03",
    icon: FaBoxOpen,
    title: "Inventory integrity",
    description:
      "Stock is reserved atomically during checkout and restored when eligible orders are cancelled.",
  },
  {
    number: "04",
    icon: FaTruck,
    title: "Delivery logic",
    description:
      "Product-specific delivery rates are resolved by region before an order is accepted.",
  },
  {
    number: "05",
    icon: FaStar,
    title: "Verified reviews",
    description:
      "Delivered orders can submit verified-purchase reviews that pass through admin moderation.",
  },
  {
    number: "06",
    icon: FaShieldAlt,
    title: "Production-minded security",
    description:
      "Protected admin routes, JWT authentication, rate limiting, CORS controls and server-side validation.",
  },
];

const DeveloperPage = () => {
    useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-slate-950">
      {/* =========================
          HERO
      ========================== */}
      <section className="relative overflow-hidden bg-[#080a0f] text-white">
        <div className="absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-violet-600/25 blur-[120px]" />

        <div className="absolute -right-40 bottom-[-8rem] h-[34rem] w-[34rem] rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:58px_58px]" />

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          {/* LEFT CONTENT */}
          <motion.div
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.65,
            }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">
              <FaCode className="text-[10px]" />

              Developer case study
            </div>

            <h1 className="mt-7 text-4xl font-black leading-[1] tracking-[-0.055em] sm:text-5xl lg:text-[58px]">
              Syed Muharram Ali

              <span className="mt-2 block bg-gradient-to-r from-violet-300 via-white to-blue-300 bg-clip-text text-transparent">
                MERN Stack Developer.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
              I build full-stack web experiences with a
              focus on practical product flows, clean
              interfaces and backend logic that keeps the
              important parts trustworthy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-500"
              >
                <FaLinkedinIn />

                LinkedIn
              </a>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                <FaGithub />

                GitHub
              </a>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3.5 text-sm font-black text-white/75 transition hover:text-white"
              >
                Explore ShopEase

                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>

            {/* QUICK STACK */}
            <div className="mt-9 flex flex-wrap gap-2">
              {[
                "React",
                "Node.js",
                "MongoDB",
                "Express",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/[0.045] px-3.5 py-2 text-[11px] font-bold text-white/50"
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          {/* RIGHT PHOTO */}
          <motion.div
            initial={{
              opacity: 0,
              x: 24,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
              delay: 0.1,
            }}
            className="relative mx-auto w-full max-w-[520px]"
          >
            {/* glow */}
            <div className="absolute -inset-5 rounded-[44px] bg-gradient-to-br from-violet-500/20 via-transparent to-blue-500/20 blur-2xl" />

            <div className="relative overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.055] p-3 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-4">
              {/* browser style header */}
              <div className="flex items-center gap-2 px-2 pb-4 pt-1">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />

                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />

                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />

                <span className="ml-3 text-[9px] font-bold uppercase tracking-[0.16em] text-white/30">
                  developer / profile
                </span>
              </div>

              {/* PHOTO */}
              <div className="relative overflow-hidden rounded-[27px] bg-slate-900">
                <img
                  src={developerPhoto}
                  alt="Syed Muharram Ali - MERN Stack Developer"
                  className="h-[430px] w-full object-cover object-top sm:h-[500px]"
                />

                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                    Developer
                  </p>

                  <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                    Syed Muharram Ali
                  </h2>

                  <p className="mt-1 text-xs font-medium text-white/50 sm:text-sm">
                    MERN Stack Developer
                  </p>
                </div>
              </div>

              {/* SMALL STATUS CARD */}
              <div className="mt-3 flex items-center justify-between rounded-[22px] border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-3">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-400" />

                  <span className="text-xs font-bold text-white/70">
                    Full-stack commerce case study
                  </span>
                </div>

                <FaNodeJs className="text-xl text-emerald-400" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================
          TECHNOLOGY
      ========================== */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">
            Technology
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* =========================
          FEATURED PROJECT
      ========================== */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">
            Featured project
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
            ShopEase — full-stack ecommerce.
          </h2>

          <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
            ShopEase is a production-focused MERN ecommerce
            project that combines storefront UX with the
            less-visible engineering that makes commerce
            reliable: inventory, orders, delivery,
            moderation and secure admin operations.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.1,
          }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.06,
              },
            },
          }}
          className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {capabilities.map(
            ({
              number,
              icon: Icon,
              title,
              description,
            }) => (
              <motion.div
                key={title}
                variants={reveal}
                className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_45px_rgba(15,23,42,0.035)] transition hover:-translate-y-1 hover:border-violet-200 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Icon />
                  </div>

                  <span className="text-xs font-black text-slate-300">
                    {number}
                  </span>
                </div>

                <h3 className="mt-6 text-base font-black tracking-tight sm:text-lg">
                  {title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {description}
                </p>
              </motion.div>
            )
          )}
        </motion.div>
      </section>

      {/* =========================
          ARCHITECTURE
      ========================== */}
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-300">
              How it fits together
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl">
              The UI is only the surface.
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/50">
              The project is structured around clear
              separation between customer experience, API
              validation, persistent data and admin
              operations.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              [
                "01",
                "Storefront",
                "Discovery, variants, cart, wishlist and checkout.",
                FaReact,
              ],
              [
                "02",
                "REST API",
                "Validation, pricing, stock, delivery and order rules.",
                FaServer,
              ],
              [
                "03",
                "MongoDB",
                "Products, variants, orders, reviews and commerce data.",
                FaDatabase,
              ],
              [
                "04",
                "Admin",
                "Catalog control, moderation, orders and analytics.",
                FaLock,
              ],
            ].map(
              ([
                number,
                title,
                text,
                Icon,
              ]) => (
                <div
                  key={number}
                  className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.045] p-5 sm:grid-cols-[54px_150px_1fr] sm:items-center"
                >
                  <span className="text-xs font-black text-violet-300">
                    {number}
                  </span>

                  <span className="flex items-center gap-2 text-sm font-black">
                    <Icon className="text-violet-300" />

                    {title}
                  </span>

                  <span className="text-sm leading-6 text-white/45">
                    {text}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* =========================
          CTA
      ========================== */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white">
          <FaStore />
        </div>

        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">
          See the work
        </p>

        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-black tracking-[-0.05em] sm:text-4xl">
          Explore the live experience or inspect the source.
        </h2>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white transition hover:bg-violet-700"
          >
            Open ShopEase

            <FaArrowRight className="text-[10px]" />
          </Link>

          <a
            href={PROJECT_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <FaGithub />

            View source code
          </a>
        </div>
      </section>
    </main>
  );
};

export default DeveloperPage;