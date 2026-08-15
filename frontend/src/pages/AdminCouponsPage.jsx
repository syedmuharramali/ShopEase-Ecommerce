import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEdit,
  FaExclamationTriangle,
  FaPercent,
  FaPlus,
  FaSpinner,
  FaTag,
  FaTimes,
} from "react-icons/fa";
import { logout } from "../slices/authSlice.js";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/+$/, "");

const blankForm = () => {
  const now = new Date();
  const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const toInput = (date) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  return {
    code: "",
    discountType: "percentage",
    value: "10",
    minSubtotal: "0",
    maxDiscount: "0",
    usageLimit: "0",
    startsAt: toInput(now),
    expiresAt: toInput(nextMonth),
    isActive: true,
  };
};

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(
    Number(value) || 0
  )}`;

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

const AdminCouponsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state) => state.auth);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(blankForm);
  const [message, setMessage] = useState(null);

  const authHeaders = useMemo(
    () =>
      adminInfo?.token
        ? { Authorization: `Bearer ${adminInfo.token}` }
        : {},
    [adminInfo?.token]
  );

  const unauthorized = useCallback(() => {
    dispatch(logout());
    navigate("/admin/login", { replace: true });
  }, [dispatch, navigate]);

  const fetchCoupons = useCallback(async () => {
    if (!adminInfo?.token) return;

    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/coupons/admin`, {
        headers: authHeaders,
      });
      setCoupons(Array.isArray(response.data?.coupons) ? response.data.coupons : []);
    } catch (error) {
      if (error.response?.status === 401) return unauthorized();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not load coupons.",
      });
    } finally {
      setLoading(false);
    }
  }, [adminInfo?.token, authHeaders, unauthorized]);

  useEffect(() => {
    if (!adminInfo?.token) {
      navigate("/admin/login", { replace: true });
      return;
    }
    fetchCoupons();
  }, [adminInfo?.token, fetchCoupons, navigate]);

  const update = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setMessage(null);
  };

  const reset = () => {
    setEditingId("");
    setForm(blankForm());
    setMessage(null);
  };

  const editCoupon = (coupon) => {
    const toInput = (value) => {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";
      const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      return local.toISOString().slice(0, 16);
    };

    setEditingId(coupon._id);
    setForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      value: String(coupon.value ?? ""),
      minSubtotal: String(coupon.minSubtotal ?? 0),
      maxDiscount: String(coupon.maxDiscount ?? 0),
      usageLimit: String(coupon.usageLimit ?? 0),
      startsAt: toInput(coupon.startsAt),
      expiresAt: toInput(coupon.expiresAt),
      isActive: coupon.isActive !== false,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      value: Number(form.value),
      minSubtotal: Number(form.minSubtotal || 0),
      maxDiscount: Number(form.maxDiscount || 0),
      usageLimit: Math.max(0, Math.floor(Number(form.usageLimit || 0))),
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: new Date(form.expiresAt).toISOString(),
    };

    if (!payload.code || !Number.isFinite(payload.value) || payload.value <= 0) {
      setMessage({ type: "error", text: "Enter a valid code and discount value." });
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await axios.patch(`${API_BASE_URL}/coupons/admin/${editingId}`, payload, {
          headers: authHeaders,
        });
      } else {
        await axios.post(`${API_BASE_URL}/coupons/admin`, payload, {
          headers: authHeaders,
        });
      }

      setMessage({
        type: "success",
        text: editingId ? "Coupon updated." : "Coupon created.",
      });
      setEditingId("");
      setForm(blankForm());
      await fetchCoupons();
    } catch (error) {
      if (error.response?.status === 401) return unauthorized();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not save this coupon.",
      });
    } finally {
      setSaving(false);
    }
  };

  const disableCoupon = async (coupon) => {
    if (!coupon?._id || coupon.isActive === false) return;
    try {
      await axios.delete(`${API_BASE_URL}/coupons/admin/${coupon._id}`, {
        headers: authHeaders,
      });
      setMessage({ type: "success", text: `${coupon.code} disabled.` });
      await fetchCoupons();
    } catch (error) {
      if (error.response?.status === 401) return unauthorized();
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Could not disable this coupon.",
      });
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

          <div className="mt-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
              <FaTag /> Promotions
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
              Coupons & discounts
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Create percentage or fixed discounts with minimum spend, expiry and usage limits. Checkout always revalidates the coupon on the server.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
        <form onSubmit={submit} className="h-fit rounded-[28px] border border-slate-200 bg-white p-6 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
                {editingId ? "Edit coupon" : "New coupon"}
              </p>
              <h2 className="mt-1 text-xl font-black">Promotion settings</h2>
            </div>
            {editingId && (
              <button type="button" onClick={reset} className="text-slate-400 hover:text-slate-950">
                <FaTimes />
              </button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-semibold text-slate-700">
              Coupon code
              <input name="code" value={form.code} onChange={update} maxLength={30} placeholder="SAVE10" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 uppercase outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Type
                <select name="discountType" value={form.discountType} onChange={update} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-violet-400">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Value
                <input type="number" min="0.01" step="0.01" name="value" value={form.value} onChange={update} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-violet-400" />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                Minimum subtotal
                <input type="number" min="0" name="minSubtotal" value={form.minSubtotal} onChange={update} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-violet-400" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Max discount
                <input type="number" min="0" name="maxDiscount" value={form.maxDiscount} onChange={update} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-violet-400" />
                <span className="mt-1 block text-[10px] font-medium text-slate-400">0 = no cap</span>
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Usage limit
              <input type="number" min="0" name="usageLimit" value={form.usageLimit} onChange={update} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-violet-400" />
              <span className="mt-1 block text-[10px] font-medium text-slate-400">0 = unlimited</span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block text-sm font-semibold text-slate-700">
                Starts
                <input type="datetime-local" name="startsAt" value={form.startsAt} onChange={update} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-violet-400" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Expires
                <input type="datetime-local" name="expiresAt" value={form.expiresAt} onChange={update} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-violet-400" />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={update} className="h-4 w-4" />
              Coupon is active
            </label>
          </div>

          {message && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 flex gap-2 rounded-xl border p-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-rose-100 bg-rose-50 text-rose-700"}`}>
              {message.type === "success" ? <FaCheckCircle /> : <FaExclamationTriangle />}
              {message.text}
            </motion.div>
          )}

          <button type="submit" disabled={saving} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-violet-700 disabled:bg-slate-400">
            {saving ? <FaSpinner className="animate-spin" /> : editingId ? <FaEdit /> : <FaPlus />}
            {saving ? "Saving..." : editingId ? "Update coupon" : "Create coupon"}
          </button>
        </form>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-black">All coupons</h2>
              <p className="mt-1 text-xs text-slate-400">{coupons.length} promotion{coupons.length === 1 ? "" : "s"}</p>
            </div>
            <FaPercent className="text-violet-500" />
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center"><FaSpinner className="animate-spin text-2xl text-violet-600" /></div>
          ) : coupons.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-500">No coupons yet. Create your first promotion.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {coupons.map((coupon) => {
                const exhausted = Number(coupon.usageLimit) > 0 && Number(coupon.usedCount) >= Number(coupon.usageLimit);
                const expired = new Date(coupon.expiresAt).getTime() <= Date.now();
                const live = coupon.isActive !== false && !expired && !exhausted;

                return (
                  <article key={coupon._id} className="py-5 first:pt-5 last:pb-0">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-slate-950 px-3 py-1.5 font-mono text-sm font-bold text-white">{coupon.code}</span>
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${live ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>{live ? "Live" : "Inactive"}</span>
                        </div>
                        <p className="mt-3 text-sm font-bold text-slate-900">
                          {coupon.discountType === "percentage" ? `${coupon.value}% off` : `${formatPrice(coupon.value)} off`}
                          {Number(coupon.maxDiscount) > 0 && coupon.discountType === "percentage" ? ` · cap ${formatPrice(coupon.maxDiscount)}` : ""}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Minimum {formatPrice(coupon.minSubtotal)} · Used {coupon.usedCount || 0}{Number(coupon.usageLimit) > 0 ? ` / ${coupon.usageLimit}` : " / unlimited"}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">Expires {formatDate(coupon.expiresAt)}</p>
                      </div>

                      <div className="flex gap-2">
                        <button type="button" onClick={() => editCoupon(coupon)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-violet-200 hover:text-violet-700"><FaEdit /> Edit</button>
                        <button type="button" onClick={() => disableCoupon(coupon)} disabled={coupon.isActive === false} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-100 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-40"><FaTimes /> Disable</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default AdminCouponsPage;