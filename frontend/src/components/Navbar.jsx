import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  FaArrowRight,
  FaBars,
  FaBoxOpen,
  FaCode,
  FaEnvelope,
  FaHeart,
  FaHome,
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
    const handleScroll = () => setScrolled(window.scrollY > 8);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const closeMenuTimer = window.setTimeout(() => {
      setIsMenuOpen(false);
    }, 0);

    return () => window.clearTimeout(closeMenuTimer);
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
      "relative inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2.5",
      "text-xs font-semibold transition duration-200 xl:gap-2 xl:px-3.5 xl:text-sm xl:font-medium",
      isActive
        ? "bg-slate-100 text-slate-950"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-950",
    ].join(" ");

  const mobileNavLinkClass = ({ isActive }) =>
    [
      "flex items-center justify-between rounded-xl px-4 py-3",
      "text-sm font-semibold transition",
      isActive
        ? "bg-slate-950 text-white"
        : "text-slate-700 hover:bg-slate-50",
    ].join(" ");

  const publicLinks = [
    { to: "/", label: "Home", icon: FaHome, end: true },
    { to: "/products", label: "Shop", icon: FaBoxOpen },
    { to: "/track-order", label: "Track order", icon: FaTruck },
    { to: "/contact", label: "Contact", icon: FaEnvelope },
    { to: "/developer", label: "Developer", icon: FaCode },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-slate-200/80 bg-white/92 shadow-[0_8px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl"
            : "border-slate-100 bg-white"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-7 xl:px-8">
          <div className="flex h-[66px] items-center justify-between gap-3">
            <NavLink
              to="/"
              className="group inline-flex min-w-0 shrink-0 items-center gap-2.5"
              aria-label="ShopEase home"
            >
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-slate-950 text-white shadow-[0_7px_20px_rgba(15,23,42,0.16)] transition duration-300 group-hover:-translate-y-0.5 sm:h-10 sm:w-10 sm:rounded-[14px]">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/90 to-blue-600/90" />
                <FaStore className="relative text-sm sm:text-base" />
              </div>

              <div className="min-w-0 leading-none">
                <span className="block text-[19px] font-semibold tracking-[-0.035em] text-slate-950 sm:text-[20px]">
                  ShopEase
                </span>
                <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400 xl:block">
                  Modern commerce
                </span>
              </div>
            </NavLink>

            <nav
              className="hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1"
              aria-label="Primary navigation"
            >
              {publicLinks.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={navLinkClass}
                >
                  <Icon className="hidden text-[11px] xl:block xl:text-[12px]" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="hidden shrink-0 items-center gap-1.5 lg:flex xl:gap-2">
              <NavLink
                to="/wishlist"
                className={({ isActive }) =>
                  `relative flex h-9 w-9 items-center justify-center rounded-xl border transition xl:h-10 xl:w-10 ${
                    isActive
                      ? "border-rose-200 bg-rose-50 text-rose-600"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-rose-600"
                  }`
                }
                aria-label={`Wishlist with ${wishlistCount} saved products`}
                title="Wishlist"
              >
                <FaHeart className="text-[13px] xl:text-sm" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative flex h-9 w-9 items-center justify-center rounded-xl border transition xl:h-10 xl:w-10 ${
                    isActive
                      ? "border-violet-200 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-violet-700"
                  }`
                }
                aria-label={`Shopping cart with ${cartCount} items`}
                title="Cart"
              >
                <FaShoppingCart className="text-[13px] xl:text-sm" />
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-950 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </NavLink>

              <div className="mx-0.5 h-5 w-px bg-slate-200 xl:mx-1 xl:h-6" />

              {adminInfo ? (
                <>
                  <NavLink
                    to="/admin/dashboard"
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 xl:h-10 xl:px-4 xl:text-sm"
                  >
                    <FaTachometerAlt className="text-[11px]" />
                    <span className="hidden xl:inline">Dashboard</span>
                  </NavLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600 xl:h-10 xl:w-10"
                    aria-label="Log out"
                    title="Log out"
                  >
                    <FaSignOutAlt />
                  </button>
                </>
              ) : (
                <NavLink
                  to="/admin/login"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 xl:h-10 xl:px-3.5 xl:text-xs"
                >
                  <FaLock className="text-[9px] xl:text-[10px]" />
                  <span className="hidden xl:inline">Admin</span>
                </NavLink>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2 lg:hidden">
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition ${
                    isActive
                      ? "border-violet-200 text-violet-700"
                      : "border-slate-200 text-slate-600"
                  }`
                }
                aria-label={`Shopping cart with ${cartCount} items`}
              >
                <FaShoppingCart className="text-sm" />
                {cartCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950 px-1 text-[8px] font-bold text-white ring-2 ring-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </NavLink>

              <button
                type="button"
                onClick={() => setIsMenuOpen((current) => !current)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition duration-300 lg:hidden ${
          isMenuOpen
            ? "pointer-events-auto bg-slate-950/35 opacity-100 backdrop-blur-[2px]"
            : "pointer-events-none bg-transparent opacity-0"
        }`}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          className={`absolute right-0 top-[66px] h-[calc(100%-66px)] w-[min(90vw,380px)] overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-2xl transition-transform duration-300 sm:p-5 ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex min-h-full flex-col">
            <div>
              <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Navigation
              </p>

              <nav className="mt-3 space-y-1.5" aria-label="Mobile navigation">
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
                  className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FaHeart className="shrink-0 text-rose-500" />
                    <span className="truncate">Wishlist</span>
                  </span>
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-600">
                    {wishlistCount}
                  </span>
                </NavLink>

                <NavLink
                  to="/cart"
                  className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FaShoppingCart className="shrink-0 text-violet-600" />
                    <span className="truncate">Cart</span>
                  </span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700">
                    {cartCount}
                  </span>
                </NavLink>
              </div>

              <div className="my-4 h-px bg-slate-100" />

              {adminInfo ? (
                <div className="space-y-1.5">
                  <NavLink to="/admin/dashboard" className={mobileNavLinkClass}>
                    <span className="flex items-center gap-3">
                      <FaTachometerAlt className="text-sm" />
                      Admin dashboard
                    </span>
                    <FaArrowRight className="text-[9px] opacity-50" />
                  </NavLink>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <FaSignOutAlt className="text-sm" />
                    Log out
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/admin/login"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  <FaLock className="text-xs" />
                  Admin access
                </NavLink>
              )}
            </div>

            <div className="mt-5 rounded-[20px] bg-slate-950 p-4 text-white sm:mt-auto sm:p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300">
                ShopEase
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                Find your next favorite.
              </p>
              <p className="mt-2 text-xs leading-5 text-white/55">
                Browse products, choose your preferred options, and order with confidence.
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
