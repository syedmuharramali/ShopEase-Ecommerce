
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
  FaLock,
  FaSignOutAlt,
  FaStore,
  FaTachometerAlt,
  FaTimes,
} from "react-icons/fa";
import { logout } from "../slices/authSlice";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { adminInfo } = useSelector((state) => state.auth);

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
      to: "/contact",
      label: "Contact",
      icon: FaEnvelope,
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