import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBolt,
  FaBoxOpen,
  FaCheckCircle,
  FaChevronDown,
  FaHeadset,
  FaHeart,
  FaLock,
  FaMapMarkerAlt,
  FaQuestionCircle,
  FaSearch,
  FaShieldAlt,
  FaShoppingBag,
  FaStar,
  FaSyncAlt,
  FaTruck,
} from "react-icons/fa";
import ProductCard from "../components/ProductCard";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");
const LIFESTYLE_IMAGE =
  "https://res.cloudinary.com/uxbmj8cq/image/upload/f_auto,q_auto:best,c_limit,w_1600/v1787179177/shopease-lifestyleoptimized.webp";

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

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
    return "https://placehold.co/1200x1400/f1f5f9/64748b?text=ShopEase";
  }

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;

  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const getImageAlt = (image, fallback) =>
  typeof image === "object" && image?.alt ? image.alt : fallback;

const getProductImage = (product) =>
  product?.storefront?.defaultVariant?.images?.[0] ||
  product?.images?.[0] ||
  null;

const getCategorySlug = (product) => {
  if (!product?.category) return "";
  if (typeof product.category === "string") return "";
  return product.category.slug || "";
};



const getProductPrice = (product) => {
  const value = product?.storefront?.minPrice;
  return value === null || value === undefined ? null : Number(value);
};



const normalizeProducts = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  return [];
};

const normalizeCategories = (payload) =>
  Array.isArray(payload?.categories) ? payload.categories : [];

const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const SectionHeading = ({
  eyebrow,
  title,
  description,
  action,
  dark = false,
}) => (
  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="max-w-2xl">
      <p
        className={`text-[11px] font-black uppercase tracking-[0.22em] ${
          dark ? "text-violet-300" : "text-violet-600"
        }`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-3 text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl ${
          dark ? "text-white" : "text-slate-950"
        }`}
      >
        {title}
      </h2>

      {description && (
        <p
          className={`mt-4 max-w-xl text-sm leading-7 sm:text-base ${
            dark ? "text-white/55" : "text-slate-500"
          }`}
        >
          {description}
        </p>
      )}
    </div>

    {action}
  </div>
);



const HeroGallery = ({ products }) => {
  const primary = products[0];
  const secondary = products[1] || primary;
  const tertiary = products[2] || secondary || primary;

  const primaryImage = getProductImage(primary);
  const secondaryImage = getProductImage(secondary);
  const tertiaryImage = getProductImage(tertiary);

  return (
    <div className="relative mx-auto min-h-[500px] w-full max-w-[620px] sm:min-h-[590px] lg:min-h-[650px]">
      <div className="absolute left-[7%] top-[8%] h-[76%] w-[76%] rounded-[54px] bg-gradient-to-br from-violet-500/30 via-indigo-400/10 to-cyan-300/20 blur-[1px]" />
      <div className="absolute -right-10 top-[9%] h-52 w-52 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute bottom-[3%] left-[2%] h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, rotate: -3 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.75 }}
        className="absolute left-[10%] top-[2%] z-10 h-[76%] w-[68%] overflow-hidden rounded-[42px] border border-white/15 bg-white/10 p-2.5 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur"
      >
        <div className="relative h-full overflow-hidden rounded-[34px] bg-slate-900">
          <img
            src={getImageUrl(primaryImage)}
            alt={getImageAlt(primaryImage, primary?.name || "ShopEase featured product")}
            className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-transparent px-6 pb-6 pt-32">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
              Featured now
            </p>
            <div className="mt-2 flex items-end justify-between gap-4">
              <h3 className="min-w-0 truncate text-xl font-black tracking-tight text-white sm:text-2xl">
                {primary?.name || "ShopEase collection"}
              </h3>

              {getProductPrice(primary) !== null && (
                <span className="shrink-0 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur-md">
                  {formatPrice(getProductPrice(primary))}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 28, rotate: 9 }}
        animate={{ opacity: 1, x: 0, rotate: 5 }}
        transition={{ duration: 0.7, delay: 0.16 }}
        className="absolute right-[1%] top-[12%] z-20 h-[34%] w-[35%] overflow-hidden rounded-[30px] border-[6px] border-slate-950 bg-slate-900 shadow-[0_25px_80px_rgba(0,0,0,0.4)]"
      >
        <img
          src={getImageUrl(secondaryImage)}
          alt={getImageAlt(
            secondaryImage,
            secondary?.name || "ShopEase product"
          )}
          className="h-full w-full object-cover"
          decoding="async"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24, rotate: -8 }}
        animate={{ opacity: 1, x: 0, rotate: -4 }}
        transition={{ duration: 0.7, delay: 0.26 }}
        className="absolute bottom-[4%] right-[8%] z-20 h-[30%] w-[31%] overflow-hidden rounded-[28px] border-[6px] border-slate-950 bg-slate-900 shadow-[0_25px_80px_rgba(0,0,0,0.4)]"
      >
        <img
          src={getImageUrl(tertiaryImage)}
          alt={getImageAlt(
            tertiaryImage,
            tertiary?.name || "ShopEase product"
          )}
          className="h-full w-full object-cover"
          decoding="async"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.38 }}
        className="absolute bottom-[14%] left-0 z-30 rounded-[22px] border border-white/10 bg-white px-4 py-3.5 text-slate-950 shadow-[0_22px_70px_rgba(0,0,0,0.35)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FaCheckCircle />
          </div>
          <div>
            <p className="text-xs font-black">Live availability</p>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              Price · stock · variants
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CategoryCard = ({ category, product, index }) => {
  const image = getProductImage(product);
  const palette = [
    "from-violet-950/90 via-violet-900/45",
    "from-blue-950/90 via-blue-900/45",
    "from-emerald-950/90 via-emerald-900/45",
    "from-amber-950/90 via-amber-900/45",
    "from-fuchsia-950/90 via-fuchsia-900/45",
    "from-cyan-950/90 via-cyan-900/45",
  ];

  return (
    <motion.div variants={reveal}>
      <Link
        to={`/products?category=${encodeURIComponent(category.slug || "")}`}
        className="group relative block min-h-[330px] overflow-hidden rounded-[34px] bg-slate-900 shadow-[0_18px_60px_rgba(15,23,42,0.08)]"
      >
        <img
          src={getImageUrl(image)}
          alt={getImageAlt(image, category.name || "ShopEase category")}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
          loading="lazy"
          decoding="async"
        />

        <div
          className={`absolute inset-0 bg-gradient-to-t ${
            palette[index % palette.length]
          } to-transparent`}
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

        <div className="relative flex min-h-[330px] flex-col justify-between p-6">
          <div className="flex justify-end">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition group-hover:translate-x-1">
              <FaArrowRight className="text-xs" />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
              Explore collection
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white">
              {category.name}
            </h3>
            <p className="mt-2 text-sm font-medium text-white/65">
              Discover {category.name?.toLowerCase() || "products"} picked for
              everyday shopping.
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const EditorialCard = ({ product, eyebrow, title, className = "" }) => {
  const image = getProductImage(product);

  return (
    <Link
      to={product?._id ? `/product/${product._id}` : "/products"}
      className={`group relative overflow-hidden rounded-[38px] bg-slate-900 ${className}`}
    >
      <img
        src={getImageUrl(image)}
        alt={getImageAlt(image, product?.name || "ShopEase edit")}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
        loading="lazy"
        decoding="async"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />

      <div className="relative flex h-full flex-col justify-end p-7 sm:p-9">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
          {eyebrow}
        </p>
        <h3 className="mt-3 max-w-md text-3xl font-black tracking-[-0.045em] text-white">
          {title}
        </h3>

        {product && (
          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-white">
            Shop {product.name}
            <FaArrowRight className="text-[10px] transition group-hover:translate-x-1" />
          </div>
        )}
      </div>
    </Link>
  );
};

const homeFaqs = [
  {
    question: "How do I track my order?",
    answer:
      "Open the Track Order page and enter your order number together with the same email or phone number used at checkout.",
  },
  {
    question: "How are delivery charges calculated?",
    answer:
      "Delivery is calculated from the product and your selected delivery region. The charge is shown before you place the order.",
  },
  {
    question: "Can I leave a product review?",
    answer:
      "Yes. Customers with a delivered ShopEase order can submit a verified-purchase review from the product page. Reviews are moderated before appearing publicly.",
  },
  {
    question: "What if I need help with an order or return?",
    answer:
      "Use the Contact page for support, or open the Returns & Refunds page to review the current return guidance before getting in touch.",
  },
];

const Home = () => {
  const navigate = useNavigate();

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collectionCount, setCollectionCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const [featuredResponse, newestResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/products`, {
            params: {
              limit: 12,
              sort: "featured",
            },
          }),
          axios.get(`${API_BASE_URL}/products`, {
            params: {
              limit: 8,
              sort: "newest",
            },
          }),
        ]);

        if (cancelled) return;

        const featured = normalizeProducts(featuredResponse.data);
        const newest = normalizeProducts(newestResponse.data);
        const categoryList =
          normalizeCategories(featuredResponse.data).length > 0
            ? normalizeCategories(featuredResponse.data)
            : normalizeCategories(newestResponse.data);

        setFeaturedProducts(featured);
        setNewProducts(newest);
        setCategories(categoryList.slice(0, 6));
        setCollectionCount(
          Number(featuredResponse.data?.pagination?.total) ||
            Number(newestResponse.data?.pagination?.total) ||
            featured.length
        );
      } catch (error) {
        console.error("Home data loading error:", error);

        if (!cancelled) {
          setFeaturedProducts([]);
          setNewProducts([]);
          setCategories([]);
          setCollectionCount(0);
          setLoadError(
            error.response?.data?.message ||
              "We couldn't load the storefront right now."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchHomeData();

    return () => {
      cancelled = true;
    };
  }, []);

  const allLoadedProducts = useMemo(() => {
    const map = new Map();

    [...featuredProducts, ...newProducts].forEach((product) => {
      if (product?._id && !map.has(product._id)) {
        map.set(product._id, product);
      }
    });

    return [...map.values()];
  }, [featuredProducts, newProducts]);

  const categoryProductMap = useMemo(() => {
    const map = new Map();

    allLoadedProducts.forEach((product) => {
      const slug = getCategorySlug(product);
      if (slug && !map.has(slug)) {
        map.set(slug, product);
      }
    });

    return map;
  }, [allLoadedProducts]);

  

  const heroProducts = featuredProducts.slice(0, 3);
  const featuredGrid = featuredProducts.slice(0, 8);
  const newestGrid = newProducts.slice(0, 4);

  const editorialPrimary =
    featuredProducts[3] || featuredProducts[0] || newProducts[0];
  const editorialSecondary =
    newProducts[1] || featuredProducts[1] || editorialPrimary;

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();

    if (!query) {
      navigate("/products");
      return;
    }

    navigate(`/products?search=${encodeURIComponent(query)}`);
  };

  

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f6f4] text-slate-950">
      <section className="relative overflow-hidden bg-[#080a0f] text-white">
        <div className="absolute left-[-10rem] top-[-7rem] h-[32rem] w-[32rem] rounded-full bg-violet-600/25 blur-[120px]" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:56px_56px]" />

        <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="relative z-10 max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-violet-200 backdrop-blur">
              <FaBolt className="text-[9px]" />
              A better way to discover what you want
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.95] tracking-[-0.065em] sm:text-6xl lg:text-[82px]">
              Find something
              <span className="block bg-gradient-to-r from-violet-300 via-white to-blue-300 bg-clip-text text-transparent">
                worth keeping.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/55 sm:text-lg">
              Discover products through beautiful collections, real variants,
              live stock and a shopping flow that keeps every important detail
              clear.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 max-w-xl rounded-[22px] border border-white/10 bg-white/[0.07] p-2 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <FaSearch className="shrink-0 text-sm text-white/35" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="What are you looking for?"
                    className="h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-100"
                >
                  Search
                  <FaArrowRight className="text-[10px]" />
                </button>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-white/40">
              <span className="inline-flex items-center gap-2"><FaCheckCircle className="text-emerald-400" />Live stock</span>
              <span className="inline-flex items-center gap-2"><FaCheckCircle className="text-emerald-400" />Exact variants</span>
              <span className="inline-flex items-center gap-2"><FaCheckCircle className="text-emerald-400" />Order tracking</span>
            </div>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 text-sm font-black text-white shadow-[0_18px_50px_rgba(124,58,237,0.3)] transition hover:-translate-y-0.5 hover:bg-violet-500">
                Explore the store <FaArrowRight className="text-[10px]" />
              </Link>
              <Link to="/track-order" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-4 text-sm font-black text-white/80 transition hover:border-white/20 hover:bg-white/[0.09] hover:text-white">
                <FaTruck className="text-xs" /> Track an order
              </Link>
            </div>
          </motion.div>

          <HeroGallery products={heroProducts} />
        </div>

        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-7xl divide-y divide-white/10 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              { icon: FaShieldAlt, title: "Secure ordering", text: "Final pricing is checked by the backend." },
              { icon: FaTruck, title: "Clear delivery", text: "Delivery charges are visible before ordering." },
              { icon: FaSyncAlt, title: "Live availability", text: "Stock follows the exact selected variant." },
              { icon: FaStar, title: "Verified reviews", text: "Real delivered orders can leave feedback." },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 py-6 sm:px-6">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.07] text-violet-300"><Icon /></div>
                <div><p className="text-sm font-black">{title}</p><p className="mt-1 text-xs leading-5 text-white/40">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Shop your way"
            title="Start with what catches your eye."
            description="Skip the endless scrolling. Jump straight into the collection that feels right."
            action={<Link to="/products" className="inline-flex w-fit items-center gap-2 text-sm font-black text-slate-700 transition hover:text-violet-600">View all products <FaArrowRight className="text-[10px]" /></Link>}
          />

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }} variants={stagger} className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => {
              const representative = categoryProductMap.get(category.slug) || null;

              return (
                <CategoryCard
                  key={category._id || category.slug || category.name}
                  category={category}
                  product={representative}
                  index={index}
                />
              );
            })}
          </motion.div>
        </section>
      )}

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <SectionHeading
            eyebrow="Trending now"
            title="The pieces people notice first."
            description="A stronger storefront edit with enough products to explore without turning the homepage into the full catalog."
            action={<Link to="/products?sort=featured" className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">Shop all <FaArrowRight className="text-[10px]" /></Link>}
          />

       {loading && featuredGrid.length === 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[30px] border border-slate-200 bg-white"
                >
                  <div className="aspect-[4/4.8] animate-pulse bg-slate-100" />

                  <div className="space-y-3 p-5">
                    <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-6 w-28 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
) : loadError && featuredGrid.length === 0 ? (
            <div className="mt-10 rounded-[32px] border border-slate-200 bg-slate-50 px-6 py-14 text-center"><FaBoxOpen className="mx-auto text-2xl text-slate-300" /><p className="mt-4 text-sm font-bold text-slate-700">{loadError}</p></div>
          ) : featuredGrid.length === 0 ? (
            <div className="mt-10 rounded-[32px] border border-slate-200 bg-slate-50 px-6 py-14 text-center"><FaShoppingBag className="mx-auto text-2xl text-slate-300" /><p className="mt-4 text-sm font-bold text-slate-700">Products are coming soon.</p></div>
          ) : (
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.08 }} variants={stagger} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredGrid.map((product) => <motion.div key={product._id} variants={reveal}><ProductCard product={product} /></motion.div>)}
            </motion.div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mb-7 max-w-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">The ShopEase edit</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">Shopping should feel like discovery.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">A quick visual break highlighting products without overwhelming the page.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <EditorialCard product={editorialPrimary} eyebrow="Featured edit" title="Products that deserve a closer look." className="min-h-[360px]" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            <EditorialCard product={editorialSecondary} eyebrow="Fresh arrival" title="Something new just landed." className="min-h-[220px]" />
            <Link to="/products" className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[30px] bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 p-6 text-white shadow-[0_20px_60px_rgba(79,70,229,0.16)]">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/15" />
              <div className="relative"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><FaHeart className="text-sm" /></div></div>
              <div className="relative"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/60">Keep exploring</p><h3 className="mt-2 max-w-xs text-2xl font-black tracking-[-0.04em]">Your next favorite is waiting.</h3><span className="mt-4 inline-flex items-center gap-2 text-sm font-black">Browse everything <FaArrowRight className="text-[10px] transition group-hover:translate-x-1" /></span></div>
            </Link>
          </div>
        </div>
      </section>

      {newestGrid.length > 0 && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
            <SectionHeading eyebrow="Just landed" title="New arrivals, front and center." description="Fresh products automatically appear here when they are added to the catalog." action={<Link to="/products?sort=newest" className="inline-flex w-fit items-center gap-2 text-sm font-black text-slate-700 transition hover:text-violet-600">See newest <FaArrowRight className="text-[10px]" /></Link>} />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {newestGrid.map((product) => <motion.div key={product._id} variants={reveal}><ProductCard product={product} /></motion.div>)}
            </motion.div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">Designed around confidence</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">Less guessing.<span className="block text-slate-400">More shopping.</span></h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-500 sm:text-base">The experience is built so shoppers can understand the product, choose the exact version they want and know what happens after checkout.</p>
            <Link to="/products" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-violet-700">Start shopping <FaArrowRight className="text-[10px]" /></Link>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={stagger} className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: FaSyncAlt, number: "01", title: "Exact variant selection", text: "Customers choose the actual available size, color or product option before ordering." },
              { icon: FaBoxOpen, number: "02", title: "Live inventory", text: "Availability follows real variant stock instead of a generic product-level guess." },
              { icon: FaMapMarkerAlt, number: "03", title: "Transparent delivery", text: "Product-specific delivery charges are shown before the order is placed." },
              { icon: FaLock, number: "04", title: "Server-checked totals", text: "Important order values are recalculated by the backend instead of trusting the browser." },
              { icon: FaTruck, number: "05", title: "Order tracking", text: "Customers can return with their order number and contact to follow fulfillment." },
              { icon: FaStar, number: "06", title: "Verified feedback", text: "Only customers with delivered orders can submit a verified-purchase review." },
            ].map(({ icon: Icon, number, title, text }) => (
              <motion.div key={title} variants={reveal} className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_14px_45px_rgba(15,23,42,0.035)] transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_22px_70px_rgba(79,70,229,0.08)] sm:p-7">
                <div className="flex items-center justify-between"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-600 group-hover:text-white"><Icon /></div><span className="text-xs font-black text-slate-300">{number}</span></div>
                <h3 className="mt-6 text-lg font-black tracking-tight text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="grid overflow-hidden rounded-[42px] border border-slate-200 bg-[#f4e8df] shadow-[0_28px_90px_rgba(15,23,42,0.10)] lg:grid-cols-[0.88fr_1.12fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">More than a catalog</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">A store that feels good to explore.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">ShopEase brings fashion, footwear, accessories and everyday essentials into one clean experience where products stay at the center of attention.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-700">Browse the collection <FaArrowRight className="text-[10px]" /></Link>
                <Link to="/wishlist" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white/70 px-5 py-3.5 text-sm font-black text-slate-700 transition hover:bg-white"><FaHeart className="text-xs" /> View wishlist</Link>
              </div>
            </div>

            <div className="relative min-h-[390px] overflow-hidden bg-slate-100 sm:min-h-[480px] lg:min-h-[560px]">
              <img
                src={LIFESTYLE_IMAGE}
                alt="ShopEase fashion, footwear and lifestyle collection"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#f4e8df]/15 via-transparent to-transparent lg:from-[#f4e8df]/25" />
              <div className="absolute bottom-5 right-5 rounded-2xl border border-white/35 bg-white/80 px-4 py-3 backdrop-blur-md sm:bottom-7 sm:right-7"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">ShopEase</p><p className="mt-1 text-sm font-black text-slate-950">Explore · discover · choose</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f6f6f4]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700"><FaQuestionCircle className="text-[10px]" /> Quick answers</div>
              <h2 className="mt-5 max-w-lg text-4xl font-black tracking-[-0.055em] text-slate-950 sm:text-5xl">Questions shouldn&apos;t interrupt the shopping.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-500 sm:text-base">Find the essentials here, then open the full help pages whenever you need more detail.</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { to: "/faq", label: "View all FAQs", text: "Answers to common shopping questions." },
                  { to: "/shipping", label: "Shipping & delivery", text: "See how delivery works before ordering." },
                  { to: "/returns", label: "Returns & refunds", text: "Review the current return guidance." },
                  { to: "/contact", label: "Contact support", text: "Reach out when you need direct help." },
                ].map((item) => (
                  <Link key={item.to} to={item.to} className="group flex items-center justify-between gap-4 rounded-[22px] border border-slate-200 bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_16px_50px_rgba(79,70,229,0.08)]">
                    <div><p className="text-sm font-black text-slate-950">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.text}</p></div><FaArrowRight className="shrink-0 text-[10px] text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_20px_70px_rgba(15,23,42,0.055)] sm:p-6">
              {homeFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={faq.question} className={`overflow-hidden border-b border-slate-100 last:border-b-0 ${isOpen ? "bg-slate-50/70" : "bg-white"}`}>
                    <button type="button" onClick={() => setOpenFaqIndex((current) => current === index ? -1 : index)} className="flex w-full items-center justify-between gap-4 px-4 py-5 text-left sm:px-5 sm:py-6" aria-expanded={isOpen}>
                      <span className="text-sm font-black text-slate-950 sm:text-base">{faq.question}</span>
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition ${isOpen ? "rotate-180 border-violet-200 bg-violet-50 text-violet-600" : "border-slate-200 bg-white text-slate-400"}`}><FaChevronDown className="text-[10px]" /></span>
                    </button>
                    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden"><p className="px-4 pb-6 text-sm leading-7 text-slate-500 sm:px-5">{faq.answer}</p></div></div>
                  </div>
                );
              })}

              <div className="mt-4 rounded-[24px] bg-slate-950 p-5 text-white sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">Still need help?</p><p className="mt-2 text-lg font-black">We&apos;ve kept support one click away.</p></div>
                  <Link to="/contact" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-violet-100"><FaHeadset className="text-xs" /> Contact us</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="relative overflow-hidden rounded-[40px] bg-[#0b0d12] px-6 py-10 text-white shadow-[0_30px_100px_rgba(15,23,42,0.14)] sm:px-10 sm:py-12 lg:px-14">
            <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-violet-600/30 blur-3xl" /><div className="absolute -bottom-24 right-[30%] h-64 w-64 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div><div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-violet-300"><FaTruck className="text-[10px]" /> Already ordered?</div><h2 className="mt-5 max-w-2xl text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-5xl">Your order should never feel like it disappeared.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-white/50">Check your current order status whenever you want with your order number and the contact used at checkout.</p></div>
              <Link to="/track-order" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-100">Track my order <FaArrowRight className="text-[10px]" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f6f6f4]">
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-200/45 blur-[100px]" />
        <div className="relative mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-slate-950 text-white shadow-[0_18px_50px_rgba(15,23,42,0.2)]"><FaShoppingBag /></div>
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-violet-600">Keep looking</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">The best part of the store might still be one scroll away.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">{collectionCount > 0 ? `${collectionCount} ${collectionCount === 1 ? "product is" : "products are"} currently available in the full ShopEase catalog.` : "Explore the complete ShopEase catalog and find what fits you."}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/products" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-7 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-violet-700">Explore ShopEase <FaArrowRight className="text-[10px]" /></Link>
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"><FaHeadset className="text-xs" /> Need help?</Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
