import React, { lazy, Suspense, useLayoutEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router";
import { Provider } from "react-redux";
import { store } from "./store.js";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import AdminToolsBar from "./components/AdminToolsBar.jsx";
import { StoreProvider } from "./context/storeContext.jsx";
import HomePage from "./pages/Home.jsx";

const ProductsPage = lazy(() => import("./pages/ProductsPage.jsx"));
const ProductDetail = lazy(() => import("./pages/ProductDetail.jsx"));
const OrderPage = lazy(() => import("./pages/OrderPage.jsx"));
const ContactUs = lazy(() => import("./pages/ContactUs.jsx"));
const CartPage = lazy(() => import("./pages/CartPage.jsx"));
const WishlistPage = lazy(() => import("./pages/WishlistPage.jsx"));
const CartCheckoutPage = lazy(() => import("./pages/CartCheckoutPage.jsx"));
const TrackOrderPage = lazy(() => import("./pages/TrackOrderPage.jsx"));
const StoreInfoPage = lazy(() => import("./pages/StoreInfoPage.jsx"));
const PaymentResultPage = lazy(() => import("./pages/PaymentResultPage.jsx"));
const DeveloperPage = lazy(() => import("./pages/DeveloperPage.jsx"));

const AdminLogin = lazy(() => import("./pages/AdminLogin.jsx"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard.jsx"));
const AdminProductForm = lazy(() => import("./pages/AdminProductForm.jsx"));
const AdminReviewsPage = lazy(() => import("./pages/AdminReviewsPage.jsx"));
const AdminCouponsPage = lazy(() => import("./pages/AdminCouponsPage.jsx"));
const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage.jsx"));
const AdminMarkazPage = lazy(() => import("./pages/AdminMarkazPage.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

const RouteFallback = () => (
  <div className="flex min-h-[55vh] items-center justify-center bg-[#f7f7f5] px-4">
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-violet-600" />
      <span className="text-sm font-semibold text-slate-600">Loading ShopEase…</span>
    </div>
  </div>
);

/*
 * React Router performs client-side navigation, so the browser can preserve
 * the previous view's scroll position. Reset on both path and query-string
 * navigation (for example category/sort changes), while deliberately ignoring
 * hash-only navigation such as #write-review.
 */
const RouteScrollManager = () => {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, [pathname, search]);

  return null;
};

const AppShell = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const showAdminTools = [
    "/admin/dashboard",
    "/admin/analytics",
    "/admin/markaz",
  ].includes(location.pathname);

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <RouteScrollManager />
      <Navbar />
      {showAdminTools && <AdminToolsBar />}

      <div className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/product/order/:id" element={<OrderPage />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/checkout/cart" element={<CartCheckoutPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/about" element={<StoreInfoPage type="about" />} />
            <Route path="/faq" element={<StoreInfoPage type="faq" />} />
            <Route path="/shipping" element={<StoreInfoPage type="shipping" />} />
            <Route path="/returns" element={<StoreInfoPage type="returns" />} />
            <Route path="/privacy" element={<StoreInfoPage type="privacy" />} />
            <Route path="/terms" element={<StoreInfoPage type="terms" />} />
            <Route path="/payment-result" element={<PaymentResultPage />} />
            <Route path="/developer" element={<DeveloperPage />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/coupons" element={<AdminCouponsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/markaz" element={<AdminMarkazPage />} />
            <Route
              path="/admin/products/new"
              element={<AdminProductForm />}
            />
            <Route
              path="/admin/products/edit/:id"
              element={<AdminProductForm />}
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <StoreProvider>
        <Router>
          <AppShell />
        </Router>
      </StoreProvider>
    </Provider>
  );
};

export default App;
