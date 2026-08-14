import React from "react";
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
import { StoreProvider } from "./context/storeContext.jsx";

import HomePage from "./pages/Home.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import ContactUs from "./pages/ContactUs.jsx";
import CartPage from "./pages/CartPage.jsx";
import WishlistPage from "./pages/WishlistPage.jsx";
import CartCheckoutPage from "./pages/CartCheckoutPage.jsx";
import TrackOrderPage from "./pages/TrackOrderPage.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminProductForm from "./pages/AdminProductForm.jsx";

import NotFound from "./pages/NotFound.jsx";

const AppShell = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f5]">
      <Navbar />

      <div className="flex-1">
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

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
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