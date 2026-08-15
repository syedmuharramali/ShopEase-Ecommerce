import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaSpinner,
  FaStar,
  FaTimes,
} from "react-icons/fa";
import { logout } from "../slices/authSlice.js";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, "");
const FILTERS = ["pending", "approved", "rejected", "all"];

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Stars = ({ rating }) => (
  <div className="flex gap-1 text-sm">
    {Array.from({ length: 5 }).map((_, index) => (
      <FaStar
        key={index}
        className={index < Number(rating || 0) ? "text-amber-400" : "text-slate-200"}
      />
    ))}
  </div>
);

const statusClass = (status) => {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "rejected") return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
};

const AdminReviewsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state) => state.auth);
  const [status, setStatus] = useState("pending");
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [message, setMessage] = useState(null);

  const authHeaders = adminInfo?.token
    ? { Authorization: `Bearer ${adminInfo.token}` }
    : {};

  const handleUnauthorized = useCallback(() => {
    dispatch(logout());
    navigate("/admin/login", { replace: true });
  }, [dispatch, navigate]);

  const fetchReviews = useCallback(
    async (page = 1, nextStatus = status) => {
      if (!adminInfo?.token) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/reviews/admin`, {
          headers: authHeaders,
          params: {
            page,
            limit: 20,
            ...(nextStatus !== "all" ? { status: nextStatus } : {}),
          },
        });

        setReviews(Array.isArray(response.data?.reviews) ? response.data.reviews : []);
        setPagination(response.data?.pagination || { page: 1, totalPages: 0, total: 0 });
      } catch (error) {
        console.error("Admin reviews loading error:", error);
        if (error.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        setReviews([]);
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Could not load product reviews.",
        });
      } finally {
        setLoading(false);
      }
    },
    [adminInfo?.token, authHeaders, handleUnauthorized, status]
  );

  useEffect(() => {
    if (!adminInfo?.token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    fetchReviews(1, status);
  }, [adminInfo?.token, navigate, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeFilter = (nextStatus) => {
    setStatus(nextStatus);
    setMessage(null);
  };

  const moderate = async (reviewId, nextStatus) => {
    if (!reviewId || updatingId) return;

    try {
      setUpdatingId(reviewId);
      setMessage(null);

      await axios.patch(
        `${API_BASE_URL}/reviews/admin/${reviewId}/status`,
        { status: nextStatus },
        { headers: authHeaders }
      );

      setMessage({
        type: "success",
        text: `Review ${nextStatus} successfully.`,
      });

      await fetchReviews(pagination.page || 1, status);
    } catch (error) {
      console.error("Review moderation error:", error);
      if (error.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not update this review.",
      });
    } finally {
      setUpdatingId("");
    }
  };

  if (!adminInfo?.token) return null;

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <FaArrowLeft className="text-xs" /> Back to dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
                <FaStar /> Review moderation
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Product reviews
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Approve genuine verified-purchase feedback or reject content that
                should not be published on the storefront.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => changeFilter(filter)}
                  className={`rounded-xl border px-4 py-2.5 text-xs font-bold capitalize transition ${
                    status === filter
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-5 flex items-start gap-3 rounded-2xl border bg-white p-4 text-sm font-semibold ${
              message.type === "success"
                ? "border-emerald-100 text-emerald-700"
                : "border-rose-100 text-rose-700"
            }`}
          >
            {message.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {message.text}
          </motion.div>
        )}

        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-slate-500">
            {pagination.total || 0} {status === "all" ? "total" : status} review
            {Number(pagination.total) === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-slate-200 bg-white">
            <FaSpinner className="animate-spin text-2xl text-violet-600" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center">
            <FaClock className="mx-auto text-3xl text-slate-300" />
            <h2 className="mt-4 text-lg font-black">No {status === "all" ? "" : status} reviews</h2>
            <p className="mt-2 text-sm text-slate-500">
              Nothing needs action in this view right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <article
                key={review._id}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.025)] sm:p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${statusClass(
                          review.status
                        )}`}
                      >
                        {review.status}
                      </span>
                      {review.verifiedPurchase && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                          <FaCheckCircle className="text-[9px]" /> Verified purchase
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-lg font-black text-slate-950">
                          {review.product?.name || "Product unavailable"}
                        </h2>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {review.reviewerName} · {review.orderNumber} · {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <Stars rating={review.rating} />
                    </div>

                    {review.title && (
                      <h3 className="mt-5 text-sm font-black text-slate-900">{review.title}</h3>
                    )}
                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                      {review.comment}
                    </p>
                  </div>

                  <div className="flex min-w-44 flex-col gap-2 lg:border-l lg:border-slate-100 lg:pl-5">
                    {review.status !== "approved" && (
                      <button
                        type="button"
                        onClick={() => moderate(review._id, "approved")}
                        disabled={updatingId === review._id}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {updatingId === review._id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                        Approve
                      </button>
                    )}
                    {review.status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => moderate(review._id, "rejected")}
                        disabled={updatingId === review._id}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                      >
                        {updatingId === review._id ? <FaSpinner className="animate-spin" /> : <FaTimes />}
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchReviews(Math.max(1, pagination.page - 1), status)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => fetchReviews(Math.min(pagination.totalPages, pagination.page + 1), status)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminReviewsPage;
