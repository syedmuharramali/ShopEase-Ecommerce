
import React, { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowRight,
  FaBars,
  FaBoxOpen,
  FaEnvelope,
  FaHome,
  FaCode,
  FaHeart,
  FaLock,
  FaShoppingCart,
  FaSignOutAlt,
  FaStore,
  FaTachometerAlt,
  FaTimes,
  FaTruck,
} from "react-icons/fa";
import { logout } from "../slices/authSlice";
import { useStore } from "../context/storeContext";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { adminInfo } = useSelector((state) => state.auth);
  const { cartCount, wishlistCount } = useStore();

  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    [
      "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5",
      "text-sm font-medium transition duration-200",
      isActive
        ? "bg-slate-100 text-slate-950"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
    ].join(" ");

  const mobileNavLinkClass = ({ isActive }) =>
    [
      "flex items-center justify-between rounded-2xl px-4 py-3.5",
      "text-sm font-semibold transition",
      isActive
        ? "bg-slate-950 text-white"
        : "text-slate-700 hover:bg-slate-50",
    ].join(" ");

  const publicLinks = [
    {
      to: "/",
      label: "Home",
      icon: FaHome,
      end: true,
    },
    {
      to: "/products",
      label: "Shop",
      icon: FaBoxOpen,
    },
    {
      to: "/track-order",
      label: "Track order",
      icon: FaTruck,
    },
    {
      to: "/contact",
      label: "Contact",
      icon: FaEnvelope,
    },
    {
  to: "/developer",
  label: "Developer",
  icon: FaCode,
},
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200/80 bg-white/92 shadow-[0_10px_35px_rgba(15,23,42,0.055)] backdrop-blur-xl"
            : "border-slate-100 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[72px] items-center justify-between">
            <NavLink
              to="/"
              className="group inline-flex items-center gap-2.5"
              aria-label="ShopEase home"
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-slate-950 text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)] transition duration-300 group-hover:-translate-y-0.5">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/90 to-blue-600/90" />
                <FaStore className="relative text-base" />
              </div>

              <div className="leading-none">
                <span className="block text-[21px] font-semibold tracking-[-0.035em] text-slate-950">
                  ShopEase
                </span>
                <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">
                  Modern commerce
                </span>
              </div>
            </NavLink>

            <nav
              className="hidden items-center gap-1 md:flex"
              aria-label="Primary navigation"
            >
              {publicLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={navLinkClass}
                >
                  <Icon className="text-[12px]" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="hidden items-center gap-2 md:flex">
              <NavLink
                to="/wishlist"
                className={({ isActive }) =>
                  `relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    isActive
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-rose-600"
                  }`
                }
                aria-label={`Wishlist with ${wishlistCount} saved products`}
                title="Wishlist"
              >
                <FaHeart className="text-sm" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    isActive
                      ? "border-violet-200 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-violet-700"
                  }`
                }
                aria-label={`Shopping cart with ${cartCount} items`}
                title="Cart"
              >
                <FaShoppingCart className="text-sm" />
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </NavLink>

              <div className="mx-1 h-6 w-px bg-slate-200" />

              {adminInfo ? (
                <>
                  <NavLink
                    to="/admin/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                  >
                    <FaTachometerAlt className="text-xs" />
                    Dashboard
                  </NavLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Log out"
                    title="Log out"
                  >
                    <FaSignOutAlt />
                  </button>
                </>
              ) : (
                <NavLink
                  to="/admin/login"
                  className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <FaLock className="text-[10px]" />
                  Admin
                </NavLink>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition duration-300 md:hidden ${
          isMenuOpen
            ? "pointer-events-auto bg-slate-950/35 opacity-100 backdrop-blur-[2px]"
            : "pointer-events-none bg-transparent opacity-0"
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          className={`absolute right-0 top-[72px] h-[calc(100%-72px)] w-[min(88vw,360px)] border-l border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-300 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            <div>
              <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Navigation
              </p>

              <nav className="mt-3 space-y-2" aria-label="Mobile navigation">
                {publicLinks.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={mobileNavLinkClass}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="text-sm" />
                      {label}
                    </span>
                    <FaArrowRight className="text-[9px] opacity-50" />
                  </NavLink>
                ))}
              </nav>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <NavLink
                  to="/wishlist"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2"><FaHeart className="text-rose-500" /> Wishlist</span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-600">{wishlistCount}</span>
                </NavLink>
                <NavLink
                  to="/cart"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-2"><FaShoppingCart className="text-violet-600" /> Cart</span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">{cartCount}</span>
                </NavLink>
              </div>

              <div className="my-5 h-px bg-slate-100" />

              {adminInfo ? (
                <div className="space-y-2">
                  <NavLink
                    to="/admin/dashboard"
                    className={mobileNavLinkClass}
                  >
                    <span className="flex items-center gap-3">
                      <FaTachometerAlt className="text-sm" />
                      Admin dashboard
                    </span>
                    <FaArrowRight className="text-[9px] opacity-50" />
                  </NavLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <FaSignOutAlt className="text-sm" />
                    Log out
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/admin/login"
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <FaLock className="text-xs" />
                  Admin access
                </NavLink>
              )}
            </div>

            <div className="mt-auto rounded-[24px] bg-slate-950 p-5 text-white">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                ShopEase
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                Find your next favorite.
              </p>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Browse products, choose your preferred options, and order with
                confidence.
              </p>

              <NavLink
                to="/products"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-white"
              >
                Explore products
                <FaArrowRight className="text-[9px]" />
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
