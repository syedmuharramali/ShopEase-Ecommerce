import React from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
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

const LINKEDIN_URL =
  "https://www.linkedin.com/in/syed-muharram-ali-0118a9428/";
const GITHUB_URL = "https://github.com/syedmuharramali";
const PROJECT_REPO =
  "https://github.com/syedmuharramali/ShopEase-Ecommerce";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
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
  return (
    <main className="min-h-screen bg-[#f6f6f4] text-slate-950">
      <section className="relative overflow-hidden bg-[#080a0f] text-white">
        <div className="absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="absolute -right-40 bottom-[-8rem] h-[34rem] w-[34rem] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:58px_58px]" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">
              <FaCode className="text-[10px]" />
              Developer case study
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.96] tracking-[-0.065em] sm:text-6xl lg:text-[76px]">
              Syed Muharram Ali
              <span className="mt-3 block bg-gradient-to-r from-violet-300 via-white to-blue-300 bg-clip-text text-transparent">
                MERN Stack Developer.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/55 sm:text-lg">
              I build full-stack web experiences with a focus on practical
              product flows, clean interfaces and backend logic that keeps the
              important parts trustworthy.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-500"
              >
                <FaLinkedinIn />
                LinkedIn
              </a>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-4 text-sm font-black text-white transition hover:bg-white/[0.1]"
              >
                <FaGithub />
                GitHub
              </a>

              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-4 text-sm font-black text-white/75 transition hover:text-white"
              >
                Explore ShopEase
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-[36px] border border-white/10 bg-white/[0.055] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:p-6">
              <div className="flex items-center gap-2 border-b border-white/10 pb-4">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                  shopease / architecture
                </span>
              </div>

              <div className="grid gap-3 py-6 sm:grid-cols-3">
                {[
                  {
                    icon: FaReact,
                    title: "Frontend",
                    text: "React + Redux",
                  },
                  {
                    icon: FaServer,
                    title: "API",
                    text: "Node + Express",
                  },
                  {
                    icon: FaDatabase,
                    title: "Data",
                    text: "MongoDB",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="rounded-[22px] border border-white/10 bg-black/15 p-4"
                  >
                    <Icon className="text-xl text-violet-300" />
                    <p className="mt-4 text-sm font-black">{title}</p>
                    <p className="mt-1 text-xs text-white/40">{text}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-[26px] border border-white/10 bg-black/20 p-5 font-mono text-xs">
                <div className="text-white/35">// core commerce flow</div>
                <div>
                  <span className="text-violet-300">Product</span>
                  <span className="text-white/35"> → </span>
                  <span className="text-blue-300">Options</span>
                  <span className="text-white/35"> → </span>
                  <span className="text-emerald-300">Variants</span>
                </div>
                <div className="pl-5 text-white/55">
                  ├── SKU / price / stock
                </div>
                <div className="pl-5 text-white/55">
                  └── exact customer selection
                </div>

                <div className="pt-3">
                  <span className="text-amber-300">Checkout</span>
                  <span className="text-white/35"> → </span>
                  <span className="text-violet-300">Server validation</span>
                  <span className="text-white/35"> → </span>
                  <span className="text-blue-300">Order</span>
                </div>
                <div className="pl-5 text-white/55">
                  ├── inventory reservation
                </div>
                <div className="pl-5 text-white/55">
                  ├── delivery calculation
                </div>
                <div className="pl-5 text-white/55">
                  └── tracking & lifecycle
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-[22px] border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-3">
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

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
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

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">
            Featured project
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
            ShopEase — full-stack ecommerce.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-500 sm:text-base">
            ShopEase is a production-focused MERN ecommerce project that
            combines storefront UX with the less-visible engineering that makes
            commerce reliable: inventory, orders, delivery, moderation and
            secure admin operations.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
          className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {capabilities.map(({ number, icon: Icon, title, description }) => (
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
              <h3 className="mt-6 text-lg font-black tracking-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-300">
              How it fits together
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
              The UI is only the surface.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/50">
              The project is structured around clear separation between
              customer experience, API validation, persistent data and admin
              operations.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              ["01", "Storefront", "Discovery, variants, cart, wishlist and checkout."],
              ["02", "REST API", "Validation, pricing, stock, delivery and order rules."],
              ["03", "MongoDB", "Products, variants, orders, reviews and commerce data."],
              ["04", "Admin", "Catalog control, moderation, orders and analytics."],
            ].map(([number, title, text]) => (
              <div
                key={number}
                className="grid gap-3 rounded-[24px] border border-white/10 bg-white/[0.045] p-5 sm:grid-cols-[54px_150px_1fr] sm:items-center"
              >
                <span className="text-xs font-black text-violet-300">
                  {number}
                </span>
                <span className="text-sm font-black">{title}</span>
                <span className="text-sm leading-6 text-white/45">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white">
          <FaStore />
        </div>
        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">
          See the work
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-5xl">
          Explore the live experience or inspect the source.
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-violet-700"
          >
            Open ShopEase
            <FaArrowRight className="text-[10px]" />
          </Link>

          <a
            href={PROJECT_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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