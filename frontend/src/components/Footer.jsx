
import React from "react";
import { Link } from "react-router";
import {
  FaArrowRight,
  FaEnvelope,
  FaGithub,
  FaLinkedinIn,
  FaLock,
  FaStore,
} from "react-icons/fa";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-white/10 bg-[#0b0d12] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.35fr_0.7fr_0.7fr_0.8fr] lg:gap-14">
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
              A modern shopping experience with clear product options,
              dependable availability, and a simple checkout flow.
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
              Explore
            </p>

            <div className="mt-5 flex flex-col items-start gap-3.5">
              <Link
                to="/"
                className="text-sm text-white/55 transition hover:text-white"
              >
                Home
              </Link>
              <Link
                to="/products"
                className="text-sm text-white/55 transition hover:text-white"
              >
                Shop
              </Link>
              <Link
                to="/contact"
                className="text-sm text-white/55 transition hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Need help?
            </p>

            <p className="mt-5 text-sm leading-6 text-white/45">
              Questions about a product or order? Reach out through our contact
              page.
            </p>

            <Link
              to="/contact"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            >
              <FaEnvelope className="text-[10px]" />
              Contact ShopEase
            </Link>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Built by
            </p>

            <div className="mt-5">
              <p className="text-sm font-semibold text-white">
                Syed Muharram Ali
              </p>
              <p className="mt-2 text-xs leading-5 text-white/40">
                Full-stack developer behind the ShopEase experience.
              </p>

              <div className="mt-4 flex items-center gap-2.5">
                <a
                  href="https://www.linkedin.com/in/syed-muharram-ali-0118a9428/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Syed Muharram Ali on LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  <FaLinkedinIn />
                </a>

                <a
                  href="https://github.com/syedmuharramali"
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
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/20">
              Designed & developed by Syed Muharram Ali
            </span>

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