import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaLock,
  FaShieldAlt,
  FaSpinner,
  FaStar,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, "");

const EMPTY_FORM = {
  orderNumber: "",
  contact: "",
  reviewerName: "",
  rating: 5,
  title: "",
  comment: "",
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const Stars = ({ value = 0, size = "text-sm" }) => (
  <div className={`flex items-center gap-1 ${size}`} aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={index}
        className={index < Math.round(Number(value) || 0) ? "text-amber-400" : "text-slate-200"}
      />
    ))}
  </div>
);

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({
    averageRating: 0,
    reviewCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [showEmptyReviewForm, setShowEmptyReviewForm] = useState(false);

  const fetchReviews = useCallback(
    async (page = 1) => {
      if (!productId) return;

      try {
        setLoading(true);
        setLoadError("");

        const response = await axios.get(
          `${API_BASE_URL}/reviews/product/${productId}`,
          { params: { page, limit: 8 } }
        );

        setReviews(Array.isArray(response.data?.reviews) ? response.data.reviews : []);
        setSummary(
          response.data?.summary || {
            averageRating: 0,
            reviewCount: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          }
        );
        setPagination(response.data?.pagination || { page: 1, totalPages: 0 });
      } catch (error) {
        console.error("Product reviews loading error:", error);
        setLoadError(
          error.response?.data?.message || "Reviews are unavailable right now."
        );
        setReviews([]);
      } finally {
        setLoading(false);
      }
    },
    [productId]
  );

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  useEffect(() => {
    const syncReviewFormWithHash = () => {
      setShowEmptyReviewForm(window.location.hash === "#write-review");
    };

    syncReviewFormWithHash();
    window.addEventListener("hashchange", syncReviewFormWithHash);

    return () => {
      window.removeEventListener("hashchange", syncReviewFormWithHash);
    };
  }, [productId]);

  const distributionMax = useMemo(
    () => Math.max(1, ...Object.values(summary.distribution || {}).map(Number)),
    [summary.distribution]
  );

  const hasReviews =
    Number(summary.reviewCount || 0) > 0 || reviews.length > 0;

  useEffect(() => {
    if (loading || hasReviews || !showEmptyReviewForm) return;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById("write-review")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hasReviews, loading, showEmptyReviewForm]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (submitMessage) setSubmitMessage(null);
  };

  const submitReview = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.orderNumber.trim() || !form.contact.trim()) {
      setSubmitMessage({
        type: "error",
        text: "Enter the delivered order number and the checkout email or phone.",
      });
      return;
    }

    if (form.comment.trim().length < 20) {
      setSubmitMessage({
        type: "error",
        text: "Please write at least 20 characters about your experience.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitMessage(null);

      const response = await axios.post(
        `${API_BASE_URL}/reviews/product/${productId}`,
        {
          ...form,
          rating: Number(form.rating),
          orderNumber: form.orderNumber.trim(),
          contact: form.contact.trim(),
          reviewerName: form.reviewerName.trim(),
          title: form.title.trim(),
          comment: form.comment.trim(),
        }
      );

      setForm(EMPTY_FORM);
      setSubmitMessage({
        type: "success",
        text:
          response.data?.message ||
          "Review submitted successfully and is awaiting approval.",
      });
    } catch (error) {
      console.error("Review submit error:", error);
      setSubmitMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "We could not submit your review right now.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reviewForm = (
    <form
      id="write-review"
      onSubmit={submitReview}
      className="scroll-mt-28 rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_14px_40px_rgba(109,40,217,0.06)] sm:p-8"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <FaShieldAlt />
        </div>
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-950">
            Write a verified review
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Purchased this product? Choose your stars below, then verify your delivered order with the order number and checkout email or phone.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Rating
        </label>
        <div className="mt-2 flex gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setForm((current) => ({ ...current, rating }))}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                Number(form.rating) >= rating
                  ? "border-amber-200 bg-amber-50 text-amber-500"
                  : "border-slate-200 bg-white text-slate-300 hover:border-slate-300"
              }`}
              aria-label={`${rating} star rating`}
            >
              <FaStar />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Delivered order number</span>
          <input
            name="orderNumber"
            value={form.orderNumber}
            onChange={updateField}
            placeholder="ORD-20260815-..."
            autoComplete="off"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-slate-600">Checkout email or phone</span>
          <input
            name="contact"
            value={form.contact}
            onChange={updateField}
            placeholder="Same contact used at checkout"
            autoComplete="off"
            className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-bold text-slate-600">Display name (optional)</span>
        <input
          name="reviewerName"
          value={form.reviewerName}
          onChange={updateField}
          maxLength={80}
          placeholder="Uses the order name when left blank"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-bold text-slate-600">Review title (optional)</span>
        <input
          name="title"
          value={form.title}
          onChange={updateField}
          maxLength={120}
          placeholder="A short summary"
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
        />
      </label>

      <label className="mt-4 block">
        <span className="flex items-center justify-between gap-3 text-xs font-bold text-slate-600">
          Your review
          <span className="font-medium text-slate-400">
            {form.comment.length}/1500
          </span>
        </span>
        <textarea
          name="comment"
          value={form.comment}
          onChange={updateField}
          minLength={20}
          maxLength={1500}
          rows={5}
          placeholder="What did you like, and what should other shoppers know?"
          className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
        />
      </label>

      {submitMessage && (
        <motion.div
          initial={{ opacity: 0, y: -3 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-4 flex gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            submitMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {submitMessage.type === "success" ? (
            <FaCheckCircle className="mt-0.5 shrink-0" />
          ) : (
            <FaLock className="mt-0.5 shrink-0" />
          )}
          <span>{submitMessage.text}</span>
        </motion.div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:bg-slate-400"
      >
        {submitting ? <FaSpinner className="animate-spin" /> : <FaStar />}
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );

  /*
   * Keep the #reviews marker in the DOM even while hidden. ProductDetail's
   * responsive CSS uses it to scope page-specific layout rules.
   */
  if (loading || loadError) {
    return <span id="reviews" className="hidden" aria-hidden="true" />;
  }

  /*
   * New products should not advertise an empty 0-review section. The review
   * form is still available when a delivered customer explicitly chooses
   * "Write review" from the product actions.
   */
  if (!hasReviews) {
    if (!showEmptyReviewForm) {
      return (
        <span
          id="reviews"
          className="hidden"
          data-empty-reviews="true"
          aria-hidden="true"
        />
      );
    }

    return (
      <section className="mt-6" id="reviews" data-empty-reviews="true">
        <div className="mx-auto max-w-2xl">{reviewForm}</div>
      </section>
    );
  }

  return (
    <section className="mt-10" id="reviews">
      <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600">
            Customer reviews
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 sm:text-3xl">
            Reviews from verified purchases
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Only customers with a delivered ShopEase order can submit a review.
            Reviews are moderated before they appear publicly.
          </p>
        </div>

        <a
          href="#write-review"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-700"
        >
          <FaStar />
          Write a review
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex items-end gap-4">
              <span className="text-5xl font-black tracking-[-0.05em] text-slate-950">
                {Number(summary.averageRating || 0).toFixed(1)}
              </span>
              <div className="pb-1">
                <Stars value={summary.averageRating} size="text-base" />
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {summary.reviewCount || 0} approved review
                  {Number(summary.reviewCount) === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-2.5">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = Number(summary.distribution?.[rating] || 0);
                const width = `${(count / distributionMax) * 100}%`;

                return (
                  <div key={rating} className="grid grid-cols-[26px_1fr_32px] items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">{rating}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width }}
                      />
                    </div>
                    <span className="text-right text-xs text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {reviewForm}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950">Latest reviews</h3>
              <p className="mt-1 text-xs text-slate-400">Approved verified-purchase feedback</p>
            </div>
            <FaCheckCircle className="text-emerald-500" />
          </div>

          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <article key={review._id} className="py-6 first:pt-6 last:pb-0">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">{review.reviewerName}</p>
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                          <FaCheckCircle className="text-[9px]" /> Verified purchase
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <Stars value={review.rating} />
                      <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {review.title && (
                  <h4 className="mt-4 text-sm font-black text-slate-900">{review.title}</h4>
                )}
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {review.comment}
                </p>
              </article>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                type="button"
                onClick={() => fetchReviews(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1 || loading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => fetchReviews(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
