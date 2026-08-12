
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShieldAlt,
  FaSpinner,
  FaStore,
  FaUser,
} from "react-icons/fa";
import { setCredentials } from "../slices/authSlice";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (adminInfo?.token) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [adminInfo?.token, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Enter your admin email and password.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${API_BASE_URL}/users/login`,
        {
          email,
          password,
        }
      );

      if (!response.data?.token) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      dispatch(setCredentials(response.data));
      navigate("/admin/dashboard", { replace: true });
    } catch (requestError) {
      console.error("Admin login error:", requestError);

      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to sign in. Check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#f5f6f8]">
      <div className="absolute -left-28 top-16 h-96 w-96 rounded-full bg-violet-200/55 blur-3xl" />
      <div className="absolute -right-28 bottom-10 h-96 w-96 rounded-full bg-blue-200/50 blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.82fr] lg:px-8 lg:py-14">
        <motion.section
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="hidden lg:block"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/80 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700 shadow-sm backdrop-blur">
            <FaShieldAlt className="text-[10px]" />
            ShopEase administration
          </div>

          <h1 className="mt-7 max-w-xl text-5xl font-semibold tracking-[-0.055em] text-slate-950 xl:text-6xl">
            Manage the store
            <span className="block text-slate-400">with confidence.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-500">
            Products, variants, inventory, and customer orders come together in
            one focused commerce workspace.
          </p>

          <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
            {[
              "Variant-aware catalog",
              "Live inventory",
              "Order management",
            ].map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-slate-200 bg-white/75 p-4 backdrop-blur"
              >
                <FaCheckCircle className="text-sm text-emerald-500" />
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-700">
                  {feature}
                </p>
              </div>
            ))}
          </div>

          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
          >
            <FaArrowLeft className="text-[10px]" />
            Return to storefront
          </Link>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_32px_100px_rgba(15,23,42,0.12)]">
            <div className="h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-blue-600" />

            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-600">
                    Secure access
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-slate-950">
                    Admin sign in
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Use your ShopEase administrator credentials.
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                  <FaStore />
                </div>
              </div>

              {error && (
                <div className="mt-6 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-5 text-red-700">
                  <FaShieldAlt className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <div className="relative">
                    <FaUser className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="username"
                      placeholder="admin@example.com"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-100"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:translate-y-0 disabled:bg-slate-300"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <FaLock className="text-xs" />
                      Sign in to dashboard
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <div className="flex gap-3">
                  <FaShieldAlt className="mt-0.5 shrink-0 text-xs text-slate-400" />
                  <p className="text-[11px] leading-5 text-slate-400">
                    This area is restricted to authorized ShopEase
                    administrators. Sessions are stored by the existing
                    ShopEase authentication state.
                  </p>
                </div>
              </div>

              <Link
                to="/"
                className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-slate-800 lg:hidden"
              >
                <FaArrowLeft className="text-[9px]" />
                Back to storefront
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default AdminLogin;