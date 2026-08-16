import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaCheckCircle,
  FaEnvelope,
  FaGithub,
  FaLinkedinIn,
  FaPaperPlane,
  FaShieldAlt,
  FaSpinner,
  FaStore,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const LINKEDIN_URL =
  "https://www.linkedin.com/in/syed-muharram-ali-0118a9428/";
const GITHUB_URL = "https://github.com/syedmuharramali";

const inputClass = (hasError = false) =>
  `w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-300 ring-4 ring-red-50 focus:border-red-400"
      : "border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
  }`;

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name] || errors.submit) {
      setErrors((current) => ({
        ...current,
        [name]: "",
        submit: "",
      }));
    }

    if (submitted) setSubmitted(false);
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Please enter your name.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your email.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.subject.trim()) {
      nextErrors.subject = "Please add a subject.";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Please enter your message.";
    } else if (formData.message.trim().length < 10) {
      nextErrors.message = "Please provide a little more detail.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate() || loading) return;

    try {
      setLoading(true);
      setErrors({});
      setSubmitted(false);

      await axios.post(`${API_BASE_URL}/email/contact`, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (requestError) {
      console.error("Contact form error:", requestError);
      setErrors({
        submit:
          requestError.response?.data?.message ||
          "We couldn't send your message right now. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-violet-100/60 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
              <FaEnvelope className="text-[10px]" />
              Get in touch
            </div>

            <h1 className="mt-7 text-4xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
              Questions?
              <span className="block text-slate-400">We’re here to help.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-500">
              Whether you have a product question, need help with an order, or
              want to discuss the ShopEase project, send a message directly to
              the ShopEase inbox.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noreferrer"
                className="group rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0A66C2]/10 text-[#0A66C2]">
                    <FaLinkedinIn />
                  </div>
                  <FaArrowRight className="text-[10px] text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">LinkedIn</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Professional inquiries and project discussions.
                </p>
              </a>

              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="group rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/5 text-slate-900">
                    <FaGithub />
                  </div>
                  <FaArrowRight className="text-[10px] text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">GitHub</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Explore projects, code, and development work.
                </p>
              </a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
              <span className="inline-flex items-center gap-2">
                <FaShieldAlt className="text-violet-500" />
                Secure server-side delivery
              </span>
              <span className="inline-flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" />
                Direct ShopEase inbox
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_30px_90px_rgba(15,23,42,0.09)] sm:p-8"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">
                  Send a message
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Tell us how we can help
                </h2>
              </div>
              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white sm:flex">
                <FaPaperPlane />
              </div>
            </div>

            {submitted && (
              <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                <FaCheckCircle className="mt-0.5 shrink-0" />
                <span>Your message was sent successfully to ShopEase.</span>
              </div>
            )}

            {errors.submit && (
              <div className="mb-6 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                {errors.submit}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Your name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    autoComplete="name"
                    disabled={loading}
                    className={inputClass(Boolean(errors.name))}
                  />
                  {errors.name && <p className="mt-2 text-xs font-medium text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className={inputClass(Boolean(errors.email))}
                  />
                  {errors.email && <p className="mt-2 text-xs font-medium text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What can we help you with?"
                  disabled={loading}
                  className={inputClass(Boolean(errors.subject))}
                />
                {errors.subject && <p className="mt-2 text-xs font-medium text-red-600">{errors.subject}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Share the details here..."
                  disabled={loading}
                  className={`${inputClass(Boolean(errors.message))} resize-none`}
                />
                <div className="mt-2 flex items-center justify-between gap-4">
                  {errors.message ? (
                    <p className="text-xs font-medium text-red-600">{errors.message}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[10px] text-slate-400">{formData.message.length} characters</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-wait disabled:translate-y-0 disabled:bg-slate-300"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="text-xs" />
                    Send message
                  </>
                )}
              </button>

              <p className="text-center text-[11px] leading-5 text-slate-400">
                Your message is sent securely through the ShopEase backend.
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="overflow-hidden rounded-[34px] bg-slate-950 px-6 py-9 text-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-violet-300">
              <FaStore />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
              ShopEase is built with real commerce workflows in mind.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Product variants, stock-aware checkout, responsive storefront
              experiences, and a backend designed for real ecommerce flows.
            </p>
          </div>

          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-100 lg:mt-0"
          >
            Connect on LinkedIn
            <FaArrowRight className="text-[10px]" />
          </a>
        </div>
      </section>
    </main>
  );
};

export default ContactUs;
