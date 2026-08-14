
import React, { useMemo } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaHeart,
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaTrash,
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

  if (!rawPath) {
    return "https://placehold.co/700x700/f8fafc/94a3b8?text=ShopEase";
  }

  const cleanPath = String(rawPath).replace(/\\/g, "/");
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;

  return `${getServerOrigin()}/${cleanPath.replace(/^\/+/, "")}`;
};

const CartPage = () => {
  const {
    cartItems,
    wishlistItems,
    updateCartQuantity,
    removeFromCart,
    addToWishlist,
  } = useStore();

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) =>
          sum + Number(item.unitPrice || 0) * Number(item.quantity || 1),
        0
      ),
    [cartItems]
  );

  const moveToWishlist = (item) => {
    if (!wishlistItems.some((saved) => saved.productId === item.productId)) {
      addToWishlist({
        productId: item.productId,
        name: item.productName,
        brand: item.brand || "",
        categoryName: item.categoryName || "",
        image: item.image,
        minPrice: item.unitPrice,
        maxPrice: item.unitPrice,
        inStock: Number(item.stock || 0) > 0,
      });
    }

    removeFromCart(item.variantId);
  };

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[72vh] bg-[#f7f7f5] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.06)] sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <FaShoppingBag className="text-xl" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            Your cart is empty.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Add the exact product variants you want and they’ll stay here on this device until you’re ready to checkout.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Browse products
            <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Shopping cart
          </p>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Ready when you are.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
                Quantities are stored locally for convenience. Final price, stock, and delivery are revalidated before each order is created.
              </p>
            </div>
            <Link
              to="/products"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-violet-600"
            >
              Continue shopping
              <FaArrowRight className="text-[10px]" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-10">
        <div className="space-y-4">
          {cartItems.map((item, index) => {
            const stock = Number(item.stock || 0);
            const lineTotal = Number(item.unitPrice || 0) * Number(item.quantity || 1);

            return (
              <motion.article
                key={item.variantId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_40px_rgba(15,23,42,0.035)] sm:p-5"
              >
                <div className="flex flex-col gap-5 sm:flex-row">
                  <Link
                    to={`/product/${item.productId}`}
                    className="h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-slate-100 sm:h-32 sm:w-32"
                  >
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          {item.brand || item.categoryName || "ShopEase"}
                        </p>
                        <Link
                          to={`/product/${item.productId}`}
                          className="mt-1 block truncate text-lg font-semibold text-slate-950 transition hover:text-violet-700"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.sku ? `SKU ${item.sku}` : item.variantTitle || "Selected variant"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.variantId)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${item.productName} from cart`}
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>

                    {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.selectedOptions.map((option) => (
                          <span
                            key={`${option.optionId || option.optionName}-${option.valueId || option.value}`}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600"
                          >
                            {option.optionName}: {option.value}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Unit price</p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {formatPrice(item.unitPrice)}
                        </p>
                        <button
                          type="button"
                          onClick={() => moveToWishlist(item)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-rose-600"
                        >
                          <FaHeart className="text-[10px]" />
                          Move to wishlist
                        </button>
                      </div>

                      <div className="flex items-end justify-between gap-5 sm:justify-end">
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                            Quantity
                          </p>
                          <div className="flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50">
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(item.variantId, Number(item.quantity) - 1)
                              }
                              disabled={Number(item.quantity) <= 1}
                              className="flex h-full w-10 items-center justify-center text-slate-500 disabled:opacity-30"
                            >
                              <FaMinus className="text-[9px]" />
                            </button>
                            <span className="w-10 text-center text-sm font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateCartQuantity(item.variantId, Number(item.quantity) + 1)
                              }
                              disabled={stock > 0 && Number(item.quantity) >= stock}
                              className="flex h-full w-10 items-center justify-center text-slate-500 disabled:opacity-30"
                            >
                              <FaPlus className="text-[9px]" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-slate-400">Line total</p>
                          <p className="mt-1 text-lg font-semibold text-slate-950">
                            {formatPrice(lineTotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.05)]">
            <h2 className="text-lg font-semibold">Cart summary</h2>
            <div className="mt-5 space-y-3 border-b border-slate-100 pb-5 text-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span>Items</span>
                <span className="font-medium text-slate-800">{cartItems.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Product subtotal</span>
                <span className="font-medium text-slate-800">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Delivery</span>
                <span className="text-xs font-medium text-violet-600">At checkout</span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-xs text-slate-400">Estimated subtotal</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">
                  {formatPrice(subtotal)}
                </p>
              </div>
            </div>

            <Link
              to="/checkout/cart"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-violet-700"
            >
              Checkout cart
              <FaArrowRight className="text-[10px]" />
            </Link>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              Current prices, stock, and regional delivery charges are checked again before orders are submitted.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default CartPage;