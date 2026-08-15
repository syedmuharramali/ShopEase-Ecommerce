
import React from "react";
import { Link } from "react-router";
import {
  FaArrowRight,
  FaEnvelope,
  FaGithub,
  FaLinkedinIn,
  FaLock,
  FaStore,
  FaTruck,
} from "react-icons/fa";

const LINKEDIN_URL =
  "https://www.linkedin.com/in/syed-muharram-ali-0118a9428/";
const GITHUB_URL = "https://github.com/syedmuharramali";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const storeLinks = [
    ["/about", "About"],
    ["/faq", "FAQ"],
    ["/shipping", "Shipping & Delivery"],
    ["/returns", "Returns & Refunds"],
  ];

  const legalLinks = [
    ["/privacy", "Privacy Policy"],
    ["/terms", "Terms & Conditions"],
  ];

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 sm:py-14 md:grid-cols-2 lg:grid-cols-[1.2fr_0.65fr_0.8fr_0.75fr_0.9fr] lg:gap-10">
          <div className="max-w-md">
            <Link
              to="/"
              className="inline-flex items-center gap-3"
              aria-label="ShopEase home"
            >
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[15px] text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-blue-600" />
                <FaStore className="relative text-lg" />
              </div>

              <div>
                <span className="block text-xl font-semibold tracking-[-0.03em]">
                  ShopEase
                </span>
                <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  Modern commerce
                </span>
              </div>
            </Link>

            <p className="mt-5 text-sm leading-7 text-white/45">
              Clear product options, live stock checks, product-specific delivery,
              cart checkout, order tracking, and verified customer reviews.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-violet-300"
            >
              Browse the collection
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Shop
            </p>
            <div className="mt-5 flex flex-col items-start gap-3.5">
              <Link to="/" className="text-sm text-white/55 transition hover:text-white">
                Home
              </Link>
              <Link to="/products" className="text-sm text-white/55 transition hover:text-white">
                Products
              </Link>
              <Link to="/wishlist" className="text-sm text-white/55 transition hover:text-white">
                Wishlist
              </Link>
              <Link to="/cart" className="text-sm text-white/55 transition hover:text-white">
                Cart
              </Link>
              <Link to="/track-order" className="text-sm text-white/55 transition hover:text-white">
                Track order
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Customer care
            </p>
            <div className="mt-5 flex flex-col items-start gap-3.5">
              {storeLinks.map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-white/55 transition hover:text-white"
                >
                  {label}
                </Link>
              ))}
              <Link to="/contact" className="text-sm text-white/55 transition hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Policies
            </p>
            <div className="mt-5 flex flex-col items-start gap-3.5">
              {legalLinks.map(([to, label]) => (
                <Link
                  key={to}
                  to={to}
                  className="text-sm text-white/55 transition hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </div>

            <Link
              to="/track-order"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            >
              <FaTruck className="text-[10px]" />
              Track an order
            </Link>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Built by
            </p>

            <div className="mt-5">
              <Link
                to="/developer"
                className="group inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-violet-300"
              >
                Syed Muharram Ali
                <FaArrowRight className="text-[9px] transition group-hover:translate-x-1" />
              </Link>

              <p className="mt-2 text-xs leading-5 text-white/40">
                MERN Stack Developer behind the ShopEase experience.
              </p>

              <Link
                to="/developer"
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-violet-300 transition hover:text-violet-200"
              >
                Developer case study
                <FaArrowRight className="text-[8px]" />
              </Link>

              <div className="mt-4 flex items-center gap-2.5">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Syed Muharram Ali on LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  <FaLinkedinIn />
                </a>

                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Syed Muharram Ali on GitHub"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  <FaGithub />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">
            © {currentYear} ShopEase. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/developer"
              className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/20 transition hover:text-white/55"
            >
              Designed & developed by Syed Muharram Ali
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-[10px] font-medium text-white/25 transition hover:text-white/60"
            >
              <FaEnvelope className="text-[8px]" />
              Support
            </Link>

            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 text-[10px] font-medium text-white/25 transition hover:text-white/60"
            >
              <FaLock className="text-[8px]" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;