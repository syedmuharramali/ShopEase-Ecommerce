// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Provider } from 'react-redux';
import { store } from './store.js';
import Navbar from './components/Navbar.jsx';
import HomePage from './pages/Home.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminProductForm from './pages/AdminProductForm.jsx';
import Footer from './components/Footer.jsx';
import ContactUs from './pages/ContactUs.jsx';
import OrderPage from './pages/OrderPage.jsx';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/edit/:id" element={<AdminProductForm />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path='/product/order/:id' element={<OrderPage></OrderPage>}></Route>
        </Routes>
        <Footer></Footer>
      </Router>
    </Provider>
  );
}

export default App;
