import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import axios from "axios";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaBox,
  FaCheck,
  FaCheckCircle,
  FaEnvelope,
  FaExclamationCircle,
  FaLock,
  FaMapMarkerAlt,
  FaMinus,
  FaPhone,
  FaPlus,
  FaShieldAlt,
  FaShoppingBag,
  FaSpinner,
  FaTruck,
  FaUser,
} from "react-icons/fa";

const API_BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const DELIVERY_REGIONS = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Islamabad Capital Territory",
];

const fieldClass = (hasError = false) =>
  `w-full rounded-2xl border bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-300 ring-4 ring-red-50 focus:border-red-400"
      : "border-slate-200 hover:border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
  }`;

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

  if (!rawPath) {
    return "https://placehold.co/900x900/f8fafc/64748b?text=ShopEase";
  }

  const cleanPath = rawPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath;
  }

  const serverOrigin = getServerOrigin();
  return `${serverOrigin}/${cleanPath.replace(/^\/+/, "")}`;
};

const getImageAlt = (image, fallback) =>
  typeof image === "object" && image?.alt ? image.alt : fallback;

const OrderPage = () => {
  const { id: productId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const variantId = searchParams.get("variantId");
  const requestedQuantity = Number(searchParams.get("quantity")) || 1;

  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [deliveryRates, setDeliveryRates] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [completedOrder, setCompletedOrder] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    province: "",
    city: "",
    address: "",
    postalCode: "",
    paymentMethod: "cod",
    quantity: requestedQuantity,
  });

  useEffect(() => {
    const fetchCheckoutData = async () => {
      if (!productId) {
        setLoadError("Product information is missing.");
        setPageLoading(false);
        return;
      }

      if (!variantId) {
        setLoadError(
          "Please select a product option before continuing to checkout."
        );
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        setLoadError("");

        const [productResponse, variantResponse, deliveryResponse] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/products/${productId}`),
            axios.get(
              `${API_BASE_URL}/products/${productId}/variants/${variantId}`
            ),
            axios.get(
              `${API_BASE_URL}/products/${productId}/delivery-rates`
            ),
          ]);

        const productData =
          productResponse.data?.product || productResponse.data;
        const variantData =
          variantResponse.data?.variant || variantResponse.data;

        if (!productData?._id || !variantData?._id) {
          throw new Error("Unable to load the selected product.");
        }

        const configured = deliveryResponse.data?.configured !== false;
        const rawRates = Array.isArray(deliveryResponse.data?.rates)
          ? deliveryResponse.data.rates
          : Array.isArray(deliveryResponse.data?.delivery?.rates)
            ? deliveryResponse.data.delivery.rates
            : [];

        const availableRates = rawRates.filter((rate) => {
          const charge = Number(rate?.charge);

          return (
            DELIVERY_REGIONS.includes(rate?.region) &&
            rate?.isAvailable !== false &&
            Number.isFinite(charge) &&
            charge > 0
          );
        });

        if (!configured || availableRates.length === 0) {
          throw new Error(
            "Delivery is not configured for this product yet. Please contact the store before ordering."
          );
        }

        setProduct(productData);
        setVariant(variantData);
        setDeliveryRates(availableRates);

        const safeQuantity = Math.max(
          1,
          Math.min(
            requestedQuantity,
            Math.max(Number(variantData.stock) || 0, 1)
          )
        );

        setFormData((prev) => ({
          ...prev,
          quantity: safeQuantity,
        }));
      } catch (error) {
        console.error("Checkout loading error:", error);
        setLoadError(
          error.response?.data?.message ||
            "We could not load this checkout. Please return to the product and try again."
        );
      } finally {
        setPageLoading(false);
      }
    };

    fetchCheckoutData();
  }, [productId, variantId, requestedQuantity]);

  const images = useMemo(() => {
    if (variant?.images?.length) return variant.images;
    if (product?.images?.length) return product.images;
    return [];
  }, [product, variant]);

  const primaryImage = images[0];

  const subtotal = useMemo(
    () => (Number(variant?.price) || 0) * Number(formData.quantity || 1),
    [variant?.price, formData.quantity]
  );

  const selectedDeliveryRate = useMemo(
    () =>
      deliveryRates.find(
        (rate) => rate.region === formData.province
      ) || null,
    [deliveryRates, formData.province]
  );

  const deliveryCharge = selectedDeliveryRate
    ? Number(selectedDeliveryRate.charge) || 0
    : 0;

  const orderTotal = subtotal + deliveryCharge;

  const selectedOptions = variant?.selectedOptions || [];
  const isUnavailable =
    !variant?.isActive || Number(variant?.stock || 0) < 1;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name] || errors.submit) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
        submit: "",
      }));
    }
  };

  const changeQuantity = (amount) => {
    const stock = Number(variant?.stock || 0);

    setFormData((prev) => ({
      ...prev,
      quantity: Math.min(
        Math.max(Number(prev.quantity || 1) + amount, 1),
        Math.max(stock, 1)
      ),
    }));

    setErrors((prev) => ({
      ...prev,
      quantity: "",
      submit: "",
    }));
  };

  const handleQuantityInput = (event) => {
    const stock = Number(variant?.stock || 0);
    const nextQuantity = Number(event.target.value);

    if (!Number.isFinite(nextQuantity)) return;

    setFormData((prev) => ({
      ...prev,
      quantity: Math.min(
        Math.max(Math.floor(nextQuantity), 1),
        Math.max(stock, 1)
      ),
    }));

    setErrors((prev) => ({
      ...prev,
      quantity: "",
      submit: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!formData.name.trim()) {
      nextErrors.name = "Please enter your full name.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Please enter your phone number.";
    } else if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      nextErrors.phone = "Please enter a valid phone number.";
    }

    if (!formData.province) {
      nextErrors.province = "Please select your delivery province.";
    } else if (!selectedDeliveryRate) {
      nextErrors.province =
        "Delivery is not available for this product in the selected province.";
    }

    if (!formData.city.trim()) {
      nextErrors.city = "Please enter your city.";
    }

    if (!formData.address.trim()) {
      nextErrors.address = "Please enter your delivery address.";
    }

    if (!formData.postalCode.trim()) {
      nextErrors.postalCode = "Please enter your postal code.";
    }

    const quantity = Number(formData.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > Number(variant?.stock || 0)
    ) {
      nextErrors.quantity = "Please choose an available quantity.";
    }

    if (isUnavailable) {
      nextErrors.submit =
        "This variant is currently unavailable. Please choose another option.";
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

      const payload = {
        variantId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phone.replace(/\D/g, ""),
        province: formData.province,
        city: formData.city.trim(),
        address: formData.address.trim(),
        postalCode: formData.postalCode.trim(),
        paymentMethod: formData.paymentMethod,
        quantity: Number(formData.quantity),
      };

      const response = await axios.post(
        `${API_BASE_URL}/orders/create/${productId}`,
        payload
      );

      const order =
        response.data?.order ||
        (response.data?._id ? response.data : null) ||
        {};

      setCompletedOrder(order);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Order submission error:", error);

      const message =
        error.response?.data?.message ||
        "We couldn't place your order. Please review your details and try again.";

      setErrors({
        submit: message,
      });

      if (error.response?.status === 409) {
        try {
          const variantResponse = await axios.get(
            `${API_BASE_URL}/products/${productId}/variants/${variantId}`
          );

          setVariant(
            variantResponse.data?.variant || variantResponse.data
          );
        } catch {
          // Keep the checkout error visible if refreshing stock also fails.
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 h-5 w-36 animate-pulse rounded-full bg-slate-200" />
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr]">
            <div className="space-y-5">
              <div className="h-24 animate-pulse rounded-[28px] bg-white" />
              <div className="h-[620px] animate-pulse rounded-[28px] bg-white" />
            </div>
            <div className="h-[540px] animate-pulse rounded-[28px] bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (loadError || !product || !variant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-4 py-16">
        <div className="w-full max-w-lg rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <FaExclamationCircle className="text-2xl" />
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Checkout needs your attention
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            {loadError}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={`/product/${productId}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <FaArrowLeft className="text-xs" />
              Back to product
            </Link>

            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Browse products
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (completedOrder) {
    const orderNumber =
      completedOrder.orderNumber ||
      completedOrder._id?.slice(-8)?.toUpperCase();

    return (
      <main className="min-h-screen bg-[#f7f7f5] px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(15,23,42,0.09)]"
        >
          <div className="bg-slate-950 px-6 py-10 text-center text-white sm:px-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-950">
              <FaCheckCircle className="text-4xl" />
            </div>

            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              Order confirmed
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Thank you for your order.
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/65">
              Your order has been recorded successfully. We’ll use the contact
              details you provided for delivery updates.
            </p>
          </div>

          <div className="p-6 sm:p-10">
            {orderNumber && (
              <div className="mb-7 flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4">
                <span className="text-sm text-slate-500">Order number</span>
                <span className="font-mono text-sm font-semibold text-slate-950">
                  {orderNumber}
                </span>
              </div>
            )}

            <div className="flex gap-4 border-b border-slate-100 pb-7">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                <img
                  src={getImageUrl(primaryImage)}
                  alt={getImageAlt(primaryImage, product.name)}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {product.brand || product.category?.name || "ShopEase"}
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold text-slate-950">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {variant.title || variant.sku}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    Qty {formData.quantity}
                  </span>
                  <span className="font-semibold text-slate-950">
                    {formatPrice(subtotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-medium text-slate-800">
                  {formatPrice(completedOrder.subtotal ?? subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Delivery</span>
                <span className="font-medium text-slate-800">
                  {formatPrice(
                    completedOrder.deliveryCharge ?? deliveryCharge
                  )}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="font-semibold text-slate-950">Total</span>
                <span className="text-lg font-semibold text-slate-950">
                  {formatPrice(completedOrder.total ?? orderTotal)}
                </span>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <FaShoppingBag />
                Continue shopping
              </Link>

              <Link
                to={`/track-order?orderNumber=${encodeURIComponent(
                  completedOrder.orderNumber || ""
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                <FaTruck />
                Track order
              </Link>

              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to home
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <Link
          to={`/product/${productId}`}
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
        >
          <FaArrowLeft className="text-xs" />
          Back to product
        </Link>

        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Secure checkout
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
              Complete your order
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Enter your delivery details and review your selected product
              before placing the order.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            <FaLock />
            Protected checkout
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.3fr_0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_50px_rgba(15,23,42,0.035)] sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <FaUser className="text-sm" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Contact information
                  </h2>
                  <p className="text-sm text-slate-500">
                    We’ll use this for order and delivery updates.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full name
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Syed Muharram Ali"
                    autoComplete="name"
                    className={fieldClass(Boolean(errors.name))}
                  />
                  {errors.name && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.name}
                    </p>
                  )}
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
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className={`${fieldClass(
                        Boolean(errors.email)
                      )} pl-10`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Phone number
                  </label>
                  <div className="relative">
                    <FaPhone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0300 1234567"
                      autoComplete="tel"
                      className={`${fieldClass(
                        Boolean(errors.phone)
                      )} pl-10`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_50px_rgba(15,23,42,0.035)] sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <FaMapMarkerAlt className="text-sm" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Delivery address
                  </h2>
                  <p className="text-sm text-slate-500">
                    Where should we send your order?
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Province
                  </label>
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className={fieldClass(Boolean(errors.province))}
                  >
                    <option value="">Select province</option>
                    {deliveryRates.map((rate) => (
                      <option key={rate.region} value={rate.region}>
                        {rate.region} — {formatPrice(rate.charge)}
                      </option>
                    ))}
                  </select>
                  {selectedDeliveryRate && (
                    <p className="mt-2 text-xs font-medium text-emerald-600">
                      Delivery charge: {formatPrice(deliveryCharge)}
                    </p>
                  )}
                  {errors.province && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.province}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    City
                  </label>
                  <input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Abbottabad"
                    autoComplete="address-level2"
                    className={fieldClass(Boolean(errors.city))}
                  />
                  {errors.city && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Complete address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House, street, area and any helpful delivery details"
                    rows={4}
                    autoComplete="street-address"
                    className={`${fieldClass(
                      Boolean(errors.address)
                    )} resize-none`}
                  />
                  {errors.address && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Postal code
                  </label>
                  <input
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="22010"
                    autoComplete="postal-code"
                    className={fieldClass(Boolean(errors.postalCode))}
                  />
                  {errors.postalCode && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.postalCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_50px_rgba(15,23,42,0.035)] sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <FaBox className="text-sm" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Payment method
                  </h2>
                  <p className="text-sm text-slate-500">
                    Choose how you’ll pay for this order.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-slate-950 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm">
                    <FaTruck />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Cash on delivery
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Pay when your order arrives.
                    </p>
                  </div>
                </div>

                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[9px] text-white">
                  <FaCheck />
                </div>

                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={formData.paymentMethod === "cod"}
                  onChange={handleChange}
                  className="sr-only"
                />
              </label>
            </div>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="lg:sticky lg:top-24"
          >
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
              <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-950">
                    Order summary
                  </h2>
                  <span className="text-xs font-medium text-slate-400">
                    1 item
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex gap-4">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <img
                      src={getImageUrl(primaryImage)}
                      alt={getImageAlt(primaryImage, product.name)}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-950 px-1.5 text-[10px] font-bold text-white">
                      {formData.quantity}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                      {product.brand || product.category?.name || "ShopEase"}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-semibold leading-5 text-slate-950">
                      {product.name}
                    </h3>

                    {variant.title && (
                      <p className="mt-1 text-xs text-slate-500">
                        {variant.title}
                      </p>
                    )}

                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {formatPrice(variant.price)}
                    </p>
                  </div>
                </div>

                {selectedOptions.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedOptions.map((option) => (
                      <span
                        key={`${option.optionId}-${option.valueId}`}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600"
                      >
                        <span className="font-medium text-slate-900">
                          {option.optionName}:
                        </span>{" "}
                        {option.value}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Quantity
                    </span>
                    <span className="text-xs text-slate-400">
                      {variant.stock} available
                    </span>
                  </div>

                  <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => changeQuantity(-1)}
                      disabled={Number(formData.quantity) <= 1}
                      className="flex h-full w-11 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Decrease quantity"
                    >
                      <FaMinus className="text-[10px]" />
                    </button>

                    <input
                      type="number"
                      min="1"
                      max={variant.stock}
                      value={formData.quantity}
                      onChange={handleQuantityInput}
                      className="h-full w-14 border-x border-slate-200 text-center text-sm font-semibold text-slate-950 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() => changeQuantity(1)}
                      disabled={
                        Number(formData.quantity) >= Number(variant.stock)
                      }
                      className="flex h-full w-11 items-center justify-center text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Increase quantity"
                    >
                      <FaPlus className="text-[10px]" />
                    </button>
                  </div>

                  {errors.quantity && (
                    <p className="mt-2 text-xs font-medium text-red-600">
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div className="my-6 h-px bg-slate-100" />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-800">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500">
                    <span>Delivery</span>
                    <span
                      className={`font-medium ${
                        selectedDeliveryRate
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {selectedDeliveryRate
                        ? formatPrice(deliveryCharge)
                        : "Select province"}
                    </span>
                  </div>
                </div>

                <div className="my-6 h-px bg-slate-100" />

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Order total
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Includes product and delivery
                    </p>
                  </div>
                  <p className="text-2xl font-semibold tracking-tight text-slate-950">
                    {formatPrice(orderTotal)}
                  </p>
                </div>

                {isUnavailable && (
                  <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3.5 text-xs font-medium leading-5 text-red-700">
                    This product option is currently out of stock.
                  </div>
                )}

                {errors.submit && (
                  <div className="mt-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-5 text-red-700">
                    <FaExclamationCircle className="mt-0.5 shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      isUnavailable ||
                      !selectedDeliveryRate
                    }
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Placing your order...
                      </>
                    ) : (
                      <>
                        <FaLock className="text-xs" />
                        Place order · {formatPrice(orderTotal)}
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
                  By placing your order, you confirm that the delivery details
                  above are correct.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                {
                  icon: FaShieldAlt,
                  label: "Secure",
                },
                {
                  icon: FaTruck,
                  label: "Delivery",
                },
                {
                  icon: FaCheckCircle,
                  label: "Verified",
                },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-4 text-center"
                >
                  <Icon className="mx-auto text-sm text-slate-700" />
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </motion.aside>
        </div>
      </div>
    </main>
  );
};

export default OrderPage;