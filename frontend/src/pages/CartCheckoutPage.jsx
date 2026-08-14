import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaCheck,
  FaCheckCircle,
  FaExclamationCircle,
  FaLock,
  FaShoppingBag,
  FaSpinner,
  FaTruck,
} from "react-icons/fa";
import { useStore } from "../context/storeContext";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const formatPrice = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)}`;

const getServerOrigin = () => {
  if (!API_BASE_URL) return "";
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
};

const getImageUrl = (image) => {
  const rawPath = typeof image === "string" ? image : image?.url;
  if (!rawPath) return "https://placehold.co/700x700/f8fafc/94a3b8?text=ShopEase";
  const cleanPath = String(rawPath).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const fieldClass = (hasError = false) =>
  `w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-300 ring-4 ring-red-50 focus:border-red-400"
      : "border-slate-200 hover:border-slate-300 focus:border-slate-950 focus:ring-4 focus:ring-slate-100"
  }`;

const CartCheckoutPage = () => {
  const { cartItems, clearCart } = useStore();
  const [validatedItems, setValidatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    city: "",
    address: "",
    postalCode: "",
    paymentMethod: "cod",
  });

  useEffect(() => {
    let ignore = false;

    const validateCart = async () => {
      if (!cartItems.length) {
        setValidatedItems([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setLoadError("");

        const productCache = new Map();
        const deliveryCache = new Map();

        await Promise.all(
          [...new Set(cartItems.map((item) => item.productId))].map(async (productId) => {
            const [productResponse, deliveryResponse] = await Promise.all([
              axios.get(`${API_BASE_URL}/products/${productId}`),
              axios.get(`${API_BASE_URL}/products/${productId}/delivery-rates`),
            ]);

            productCache.set(
              productId,
              productResponse.data?.product || productResponse.data
            );
            deliveryCache.set(
              productId,
              Array.isArray(deliveryResponse.data?.rates)
                ? deliveryResponse.data.rates.filter(
                    (rate) => rate?.isAvailable !== false && Number(rate?.charge) > 0
                  )
                : Array.isArray(deliveryResponse.data?.delivery?.rates)
                  ? deliveryResponse.data.delivery.rates.filter(
                      (rate) => rate?.isAvailable !== false && Number(rate?.charge) > 0
                    )
                  : []
            );
          })
        );

        const rows = await Promise.all(
          cartItems.map(async (cartItem) => {
            const response = await axios.get(
              `${API_BASE_URL}/products/${cartItem.productId}/variants/${cartItem.variantId}`
            );
            const variant = response.data?.variant || response.data;
            const product = productCache.get(cartItem.productId);
            const stock = Number(variant?.stock || 0);
            const price = Number(variant?.price);

            return {
              ...cartItem,
              product,
              variant,
              deliveryRates: deliveryCache.get(cartItem.productId) || [],
              currentName: product?.name || cartItem.productName,
              currentImage:
                variant?.images?.[0] || product?.images?.[0] || cartItem.image,
              currentPrice: Number.isFinite(price) ? price : 0,
              currentStock: stock,
              isValid:
                Boolean(product?._id) &&
                Boolean(variant?._id) &&
                variant?.isActive !== false &&
                Number.isFinite(price) &&
                price >= 0 &&
                stock >= Number(cartItem.quantity || 1),
            };
          })
        );

        if (!ignore) setValidatedItems(rows);
      } catch (error) {
        console.error("Cart checkout validation error:", error);
        if (!ignore) {
          setLoadError(
            error.response?.data?.message ||
              "We could not validate your cart. Return to the cart and try again."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    validateCart();
    return () => {
      ignore = true;
    };
  }, [cartItems]);

  const availableProvinces = useMemo(() => {
    if (!validatedItems.length) return [];

    const first = validatedItems[0].deliveryRates || [];
    return first
      .filter((rate) =>
        validatedItems.every((item) =>
          (item.deliveryRates || []).some(
            (candidate) =>
              candidate.region === rate.region &&
              candidate.isAvailable !== false &&
              Number(candidate.charge) > 0
          )
        )
      )
      .map((rate) => rate.region);
  }, [validatedItems]);

  const pricing = useMemo(() => {
    let subtotal = 0;
    let delivery = 0;
    const chargedProducts = new Set();

    validatedItems.forEach((item) => {
      subtotal += item.currentPrice * Number(item.quantity || 1);

      if (formData.province && !chargedProducts.has(item.productId)) {
        const rate = (item.deliveryRates || []).find(
          (candidate) => candidate.region === formData.province
        );
        if (rate) delivery += Number(rate.charge) || 0;
        chargedProducts.add(item.productId);
      }
    });

    return {
      subtotal,
      delivery,
      total: subtotal + delivery,
    };
  }, [validatedItems, formData.province]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "", submit: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!formData.name.trim()) nextErrors.name = "Please enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(formData.email.trim()))
      nextErrors.email = "Please enter a valid email address.";
    if (phoneDigits.length < 10 || phoneDigits.length > 15)
      nextErrors.phone = "Please enter a valid phone number.";
    if (!formData.province) nextErrors.province = "Please select a delivery province.";
    else if (!availableProvinces.includes(formData.province))
      nextErrors.province = "Every product in this cart must be deliverable to the selected province.";
    if (!formData.city.trim()) nextErrors.city = "Please enter your city.";
    if (!formData.address.trim()) nextErrors.address = "Please enter your delivery address.";
    if (!formData.postalCode.trim()) nextErrors.postalCode = "Please enter your postal code.";

    const invalidItem = validatedItems.find((item) => !item.isValid);
    if (invalidItem) {
      nextErrors.submit = `${invalidItem.currentName} no longer has enough stock or is unavailable.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm() || submitting) return;

    try {
      setSubmitting(true);
      setErrors({});

      const response = await axios.post(`${API_BASE_URL}/orders/create-cart`, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phone.replace(/\D/g, ""),
        province: formData.province,
        city: formData.city.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim(),
        paymentMethod: "cod",
        items: validatedItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: Number(item.quantity),
        })),
      });

      const order = response.data?.order || response.data;
      setCompletedOrder(order);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Cart order submission error:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          "Your cart changed while ordering. Review it and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <main className="min-h-[76vh] bg-[#f7f7f5] px-4 py-16 sm:px-6 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.09)]"
        >
          <div className="bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <FaCheckCircle className="text-xl" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-white/55">
              Order confirmed
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Your cart order is placed.</h1>
          </div>
          <div className="p-6 sm:p-10">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-slate-500">Order number</span>
                <span className="font-mono text-sm font-semibold text-slate-950">
                  {completedOrder.orderNumber || "Confirmed"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-200 pt-3">
                <span className="text-sm text-slate-500">Final total</span>
                <span className="text-lg font-semibold text-slate-950">
                  {formatPrice(completedOrder.total ?? pricing.total)}
                </span>
              </div>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white"
              >
                Continue shopping
              </Link>
              <Link
                to={`/track-order?orderNumber=${encodeURIComponent(
                  completedOrder.orderNumber || ""
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-sm font-semibold text-violet-700"
              >
                <FaTruck />
                Track order
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700"
              >
                Back to home
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  if (!cartItems.length) {
    return (
      <main className="min-h-[70vh] bg-[#f7f7f5] px-4 py-20 text-center">
        <FaShoppingBag className="mx-auto text-3xl text-slate-300" />
        <h1 className="mt-5 text-2xl font-semibold text-slate-950">Your cart is empty.</h1>
        <Link to="/products" className="mt-6 inline-flex rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white">
          Browse products
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <FaSpinner className="mx-auto animate-spin text-2xl text-violet-600" />
          <p className="mt-3 text-sm text-slate-500">Checking current prices, stock and delivery…</p>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-[70vh] bg-[#f7f7f5] px-4 py-20">
        <div className="mx-auto max-w-lg rounded-[28px] border border-red-100 bg-white p-8 text-center">
          <FaExclamationCircle className="mx-auto text-2xl text-red-500" />
          <h1 className="mt-4 text-xl font-semibold">Cart needs attention</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">{loadError}</p>
          <Link to="/cart" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
            <FaArrowLeft className="text-xs" /> Back to cart
          </Link>
        </div>
      </main>
    );
  }

  const hasInvalidItems = validatedItems.some((item) => !item.isValid);

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Link to="/cart" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
          <FaArrowLeft className="text-xs" /> Back to cart
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">Secure checkout</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">Complete your order.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            One order number covers the complete cart. The server recalculates every price, stock level and regional delivery fee before saving it.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1fr_420px]">
          <form id="cart-checkout-form" onSubmit={handleSubmit} className="space-y-5">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-lg font-semibold">Contact details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                  <input name="name" value={formData.name} onChange={handleChange} className={fieldClass(Boolean(errors.name))} placeholder="Your full name" />
                  {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={fieldClass(Boolean(errors.email))} placeholder="you@example.com" />
                  {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone number</label>
                  <input name="phone" value={formData.phone} onChange={handleChange} className={fieldClass(Boolean(errors.phone))} placeholder="03XXXXXXXXX" />
                  {errors.phone && <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><FaTruck /></div>
                <div><h2 className="font-semibold">Delivery address</h2><p className="text-sm text-slate-500">Only provinces available for every cart product are shown.</p></div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Province / region</label>
                  <select name="province" value={formData.province} onChange={handleChange} className={fieldClass(Boolean(errors.province))}>
                    <option value="">Select province</option>
                    {availableProvinces.map((province) => <option key={province} value={province}>{province}</option>)}
                  </select>
                  {errors.province && <p className="mt-1.5 text-xs text-red-600">{errors.province}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
                  <input name="city" value={formData.city} onChange={handleChange} className={fieldClass(Boolean(errors.city))} placeholder="City" />
                  {errors.city && <p className="mt-1.5 text-xs text-red-600">{errors.city}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                  <textarea name="address" rows={3} value={formData.address} onChange={handleChange} className={fieldClass(Boolean(errors.address))} placeholder="House, street, area and helpful delivery details" />
                  {errors.address && <p className="mt-1.5 text-xs text-red-600">{errors.address}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Postal code</label>
                  <input name="postalCode" value={formData.postalCode} onChange={handleChange} className={fieldClass(Boolean(errors.postalCode))} placeholder="Postal code" />
                  {errors.postalCode && <p className="mt-1.5 text-xs text-red-600">{errors.postalCode}</p>}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="font-semibold">Payment method</h2>
              <label className="mt-5 flex items-center justify-between rounded-2xl border-2 border-slate-950 bg-slate-50 p-4">
                <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white"><FaTruck /></div><div><p className="text-sm font-semibold">Cash on delivery</p><p className="text-xs text-slate-500">Pay when the order arrives.</p></div></div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[9px] text-white"><FaCheck /></div>
              </label>
            </section>
          </form>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
              <div className="border-b border-slate-100 px-5 py-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Order summary</h2><span className="text-xs text-slate-400">{validatedItems.length} lines</span></div></div>
              <div className="max-h-[390px] divide-y divide-slate-100 overflow-y-auto px-5">
                {validatedItems.map((item) => (
                  <div key={item.variantId} className="flex gap-3 py-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100"><img src={getImageUrl(item.currentImage)} alt={item.currentName} className="h-full w-full object-cover" /><span className="absolute right-1 top-1 rounded-full bg-slate-950 px-1.5 py-0.5 text-[9px] font-bold text-white">{item.quantity}</span></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.currentName}</p><p className="mt-1 text-[10px] text-slate-400">{item.variant?.sku || item.sku || "Selected variant"}</p><p className="mt-2 text-sm font-medium">{formatPrice(item.currentPrice * Number(item.quantity || 1))}</p>{!item.isValid && <p className="mt-1 text-[10px] font-semibold text-red-600">Needs attention</p>}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 p-5">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500"><span>Subtotal</span><span className="font-medium text-slate-800">{formatPrice(pricing.subtotal)}</span></div>
                  <div className="flex justify-between text-slate-500"><span>Delivery</span><span className="font-medium text-slate-800">{formData.province ? formatPrice(pricing.delivery) : "Select province"}</span></div>
                </div>
                <div className="my-5 h-px bg-slate-100" />
                <div className="flex items-end justify-between"><div><p className="text-sm text-slate-500">Order total</p><p className="mt-0.5 text-[11px] text-slate-400">Server verified at submission</p></div><p className="text-2xl font-semibold">{formatPrice(pricing.total)}</p></div>
                {hasInvalidItems && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-700">One or more cart items changed. Return to the cart or product page before ordering.</div>}
                {errors.submit && <div className="mt-5 flex gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs text-red-700"><FaExclamationCircle className="mt-0.5 shrink-0" />{errors.submit}</div>}
                <button form="cart-checkout-form" type="submit" disabled={submitting || hasInvalidItems || !availableProvinces.length} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                  {submitting ? <><FaSpinner className="animate-spin" /> Placing order…</> : <><FaLock className="text-xs" /> Place order · {formatPrice(pricing.total)}</>}
                </button>
                <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">Delivery is charged once per unique product in the cart. Different variants of the same product share that product’s delivery fee.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CartCheckoutPage;