
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaEnvelope,
  FaPaperPlane,
  FaSpinner,
  FaTimes,
  FaUser,
} from "react-icons/fa";

const API_BASE_URL = (
  import.meta.env.VITE_BASE_URL || ""
).replace(/\/$/, "");

const formatPrice = (value) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const EmailModal = ({
  product,
  variant,
  onClose,
}) => {
  const [formData, setFormData] =
    useState({
      name: "",
      email: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] =
    useState("");

  const variantSummary = useMemo(() => {
    if (!variant) return "";

    const optionText = (
      variant.selectedOptions || []
    )
      .map(
        (option) =>
          `${option.optionName}: ${option.value}`
      )
      .join(" · ");

    return (
      optionText ||
      variant.title ||
      variant.sku ||
      ""
    );
  }, [variant]);

  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !loading
      ) {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [loading, onClose]);

  const handleChange = (event) => {
    const { name, value } =
      event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const name =
      formData.name.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    if (!name) {
      setError(
        "Please enter your name."
      );
      return;
    }

    if (
      !email ||
      !/^\S+@\S+\.\S+$/.test(email)
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!product?._id) {
      setError(
        "Product information is unavailable."
      );
      return;
    }

    if (!variant?._id) {
      setError(
        "Please select an available product variant first."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.post(
        `${API_BASE_URL}/email/send-product-info`,
        {
          name,
          email,
          productId:
            product._id,
          variantId:
            variant._id,
        }
      );

      setSuccess(true);
    } catch (requestError) {
      console.error(
        "Product email error:",
        requestError
      );

      setError(
        requestError.response?.data
          ?.message ||
          "We couldn't send the product information. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 16,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        className="w-full max-w-md overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.24)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-email-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">
              Product details
            </p>

            <h2
              id="product-email-title"
              className="mt-2 text-xl font-semibold tracking-[-0.025em] text-slate-950"
            >
              Send this to my inbox
            </h2>

            <p className="mt-1 truncate text-xs text-slate-400">
              {product?.name ||
                "ShopEase product"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-40"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              className="py-4 text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <FaCheckCircle className="text-2xl" />
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-950">
                Check your inbox
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                We sent the selected
                product variant to{" "}
                <span className="font-semibold text-slate-700">
                  {formData.email}
                </span>
                .
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <>
              <p className="text-sm leading-6 text-slate-500">
                Enter your details and
                ShopEase will send the
                exact variant you selected.
              </p>

              {variant && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {variant.title ||
                          product?.name ||
                          "Selected variant"}
                      </p>

                      {variantSummary && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {variantSummary}
                        </p>
                      )}

                      {variant.sku && (
                        <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                          SKU {variant.sku}
                        </p>
                      )}
                    </div>

                    <p className="shrink-0 text-sm font-bold text-slate-950">
                      {formatPrice(
                        variant.price
                      )}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-5 text-red-700">
                  {error}
                </div>
              )}

              <form
                onSubmit={
                  handleSubmit
                }
                className="mt-6 space-y-4"
              >
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Your name
                  </label>

                  <div className="relative">
                    <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

                    <input
                      type="text"
                      name="name"
                      value={
                        formData.name
                      }
                      onChange={
                        handleChange
                      }
                      autoComplete="name"
                      placeholder="Your full name"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>

                  <div className="relative">
                    <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

                    <input
                      type="email"
                      name="email"
                      value={
                        formData.email
                      }
                      onChange={
                        handleChange
                      }
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:translate-y-0 disabled:bg-slate-300"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="text-xs" />
                      Email selected variant
                    </>
                  )}
                </button>
              </form>

              <p className="mt-3 text-center text-[10px] leading-5 text-slate-400">
                Your details are used
                only to send the
                requested product
                information.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default EmailModal;