import React from "react";
import { Link, useParams } from "react-router";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaClipboardList,
  FaEnvelope,
  FaLock,
  FaQuestionCircle,
  FaShieldAlt,
  FaStore,
  FaTruck,
  FaUndoAlt,
} from "react-icons/fa";

const PAGE_DATA = {
  about: {
    eyebrow: "About ShopEase",
    title: "A simpler way to shop with confidence.",
    intro:
      "ShopEase is built around clear product options, live inventory, transparent delivery charges, and a checkout flow that verifies the exact item you choose before an order is created.",
    icon: FaStore,
    sections: [
      {
        title: "What we focus on",
        body:
          "The store is designed to make product discovery and ordering straightforward. Product variants, stock, pricing, delivery availability, and order totals are validated by the storefront and backend rather than left to guesswork.",
      },
      {
        title: "Shopping that stays clear",
        body:
          "Where a product has size, color, or another option, the exact available combination is shown before checkout. Customers can also use cart, wishlist, related products, and order tracking without needing a customer account.",
      },
      {
        title: "Support when you need it",
        body:
          "Questions about a product, delivery, an existing order, or a return can be sent through the Contact page. Order tracking is also available using the order number and the checkout email or phone.",
      },
    ],
  },
  faq: {
    eyebrow: "Frequently asked questions",
    title: "Quick answers before and after you order.",
    intro:
      "These answers cover the current ShopEase ordering experience, including product options, delivery, payment, tracking, and reviews.",
    icon: FaQuestionCircle,
    faq: [
      {
        q: "How do I know which product option I am ordering?",
        a: "Choose the available size, color, or other option on the product page. Price, stock, and the selected variant update before you add the item to cart or continue with Buy Now.",
      },
      {
        q: "How is delivery charged?",
        a: "Delivery charges are configured per product and depend on the selected province or region. The final delivery amount is calculated again by the server during checkout.",
      },
      {
        q: "Which payment method is currently available?",
        a: "ShopEase currently supports Cash on Delivery for customer checkout.",
      },
      {
        q: "Can I track my order?",
        a: "Yes. Open Track Order and enter your order number plus the same email address or phone number used at checkout.",
      },
      {
        q: "Can I review a product?",
        a: "Yes, after a delivered purchase. Reviews require the delivered order number and matching checkout contact details. Submitted reviews are moderated before appearing publicly.",
      },
      {
        q: "Do I need an account to use the cart or wishlist?",
        a: "No. Cart and wishlist are currently stored in your browser so you can use them without creating a customer account.",
      },
    ],
  },
  shipping: {
    eyebrow: "Shipping & delivery",
    title: "Delivery costs are shown before you place the order.",
    intro:
      "ShopEase uses product-specific delivery rates. Availability and delivery cost are checked against the delivery region selected at checkout.",
    icon: FaTruck,
    sections: [
      {
        title: "Supported delivery regions",
        body:
          "Current delivery-rate configuration supports Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Gilgit-Baltistan, and Islamabad Capital Territory. A product may be unavailable for a specific region if its delivery setting is disabled.",
      },
      {
        title: "How delivery charges are calculated",
        body:
          "Each product can have its own delivery charge. In a cart order, different variants of the same product share that product's delivery charge once, while different products can contribute separate delivery charges.",
      },
      {
        title: "Order progress",
        body:
          "Order status can move through pending, confirmed, processing, shipped, and delivered. Use the Track Order page with your order number and checkout contact details to view the latest status.",
      },
    ],
  },
  returns: {
    eyebrow: "Returns & refunds",
    title: "A clear process when something is not right.",
    intro:
      "If you receive an incorrect, damaged, or otherwise problematic item, contact ShopEase as soon as possible with your order details so the issue can be reviewed.",
    icon: FaUndoAlt,
    sections: [
      {
        title: "Return requests",
        body:
          "Contact us within 7 days of delivery for a return request. Items should normally be unused, in their original condition, and include any original packaging unless the issue is damage, defect, or an incorrect item received.",
      },
      {
        title: "Items that may not qualify",
        body:
          "Items that have been used, altered, damaged after delivery, or returned without the product components supplied may not be eligible. Product-specific restrictions can also apply where clearly disclosed before purchase.",
      },
      {
        title: "Refund handling",
        body:
          "Where a return or refund is approved, ShopEase will communicate the available resolution and next steps. Delivery charges may be treated differently depending on whether the return is caused by a fulfillment error or another reason.",
      },
    ],
    note:
      "This return policy is the current ShopEase store policy and should be reviewed before launch if you want different return windows or product-specific rules.",
  },
  privacy: {
    eyebrow: "Privacy policy",
    title: "How ShopEase uses customer information.",
    intro:
      "ShopEase collects only the information needed to operate the storefront, process orders, provide order tracking and support, and protect the service from abuse.",
    icon: FaShieldAlt,
    sections: [
      {
        title: "Information used for orders",
        body:
          "Checkout can collect your name, email address, phone number, delivery province or region, city, address, postal code, ordered products, selected variants, quantities, delivery charges, and order status.",
      },
      {
        title: "Cart and wishlist storage",
        body:
          "Because customer accounts are not currently required, cart and wishlist information is stored in your browser using local storage. Clearing browser storage can remove those saved items.",
      },
      {
        title: "Order tracking and reviews",
        body:
          "Order tracking and verified-purchase review submission require an order number plus matching checkout contact information. Public review pages do not display your checkout email, phone number, or delivery address.",
      },
      {
        title: "Service providers and security",
        body:
          "Hosting, database, email, media-storage, or other infrastructure providers may process information needed to operate the store. Administrative routes are protected and public abuse-sensitive endpoints use rate limiting where appropriate.",
      },
    ],
  },
  terms: {
    eyebrow: "Terms & conditions",
    title: "Terms for using and ordering from ShopEase.",
    intro:
      "By using ShopEase or placing an order, you agree to provide accurate information and use the website only for lawful shopping and support purposes.",
    icon: FaClipboardList,
    sections: [
      {
        title: "Products, price, and availability",
        body:
          "Product availability, variant stock, pricing, and delivery settings can change. The backend validates the current product, selected variant, stock, price, and delivery charge again when an order is submitted.",
      },
      {
        title: "Orders",
        body:
          "An order is subject to confirmation and fulfillment. ShopEase may cancel or decline an order when an item is unavailable, order information cannot be verified, fulfillment is not possible, or misuse is suspected.",
      },
      {
        title: "Customer information",
        body:
          "You are responsible for providing accurate contact and delivery information. Incorrect details can delay or prevent fulfillment and may affect order tracking or verified-purchase review eligibility.",
      },
      {
        title: "Website use",
        body:
          "Do not attempt to interfere with site operation, bypass security controls, abuse public endpoints, access administrative features without authorization, or use ShopEase for fraudulent activity.",
      },
    ],
  },
};

const INFO_LINKS = [
  ["about", "About"],
  ["faq", "FAQ"],
  ["shipping", "Shipping"],
  ["returns", "Returns"],
  ["privacy", "Privacy"],
  ["terms", "Terms"],
];

const StoreInfoPage = ({ type: explicitType }) => {
  const params = useParams();
  const type = explicitType || params.type || "about";
  const page = PAGE_DATA[type] || PAGE_DATA.about;
  const Icon = page.icon;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">
                <Icon className="text-[10px]" />
                {page.eyebrow}
              </div>
              <h1 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                {page.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-500">
                {page.intro}
              </p>
            </div>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-700"
            >
              <FaEnvelope /> Contact support
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside>
            <div className="sticky top-24 rounded-[24px] border border-slate-200 bg-white p-3">
              <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.17em] text-slate-400">
                Store information
              </p>
              <nav className="space-y-1">
                {INFO_LINKS.map(([key, label]) => (
                  <Link
                    key={key}
                    to={`/${key}`}
                    className={`flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold transition ${
                      key === type
                        ? "bg-slate-950 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    }`}
                  >
                    {label}
                    <FaArrowRight className="text-[9px] opacity-50" />
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <div>
            {page.faq ? (
              <div className="space-y-3">
                {page.faq.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-[24px] border border-slate-200 bg-white p-5 open:shadow-[0_16px_45px_rgba(15,23,42,0.06)] sm:p-6"
                  >
                    <summary className="cursor-pointer list-none pr-6 text-base font-bold text-slate-950 marker:hidden">
                      <span className="flex items-start justify-between gap-4">
                        {item.q}
                        <span className="text-violet-600 transition group-open:rotate-45">+</span>
                      </span>
                    </summary>
                    <p className="mt-4 max-w-3xl border-t border-slate-100 pt-4 text-sm leading-7 text-slate-600">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            ) : (
              <div className="grid gap-5">
                {page.sections.map((section, index) => (
                  <article
                    key={section.title}
                    className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_35px_rgba(15,23,42,0.03)] sm:p-8"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-sm font-black text-violet-700">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-[-0.025em] text-slate-950">
                          {section.title}
                        </h2>
                        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-[15px]">
                          {section.body}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {page.note && (
              <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
                <FaCheckCircle className="mt-1 shrink-0" />
                <p>{page.note}</p>
              </div>
            )}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Link
                to="/products"
                className="rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <FaBoxOpen className="text-violet-600" />
                <p className="mt-3 text-sm font-bold">Browse products</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Explore the current collection.</p>
              </Link>
              <Link
                to="/track-order"
                className="rounded-[22px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <FaTruck className="text-violet-600" />
                <p className="mt-3 text-sm font-bold">Track an order</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Check the latest order status.</p>
              </Link>
              <Link
                to="/contact"
                className="rounded-[22px] bg-slate-950 p-5 text-white transition hover:-translate-y-0.5 hover:bg-violet-700"
              >
                <FaLock className="text-violet-300" />
                <p className="mt-3 text-sm font-bold">Need help?</p>
                <p className="mt-1 text-xs leading-5 text-white/55">Contact ShopEase support.</p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default StoreInfoPage;
