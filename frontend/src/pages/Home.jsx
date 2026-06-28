// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { FaStore, FaTruck, FaShieldAlt, FaUndo, FaStar, FaUsers, FaBoxOpen, FaHeadset } from 'react-icons/fa';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/products`);
      console.log(response.data);
      setProducts(response.data?.slice(0, 8));
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                Welcome to <span className="text-yellow-300">ShopEase</span>
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl">
                Discover amazing products at great prices. Get product information delivered to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Link
                  to="/products"
                  className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Shop Now
                </Link>
                <Link
                  to="/contact"
                  className="inline-block border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300"
                >
                  Contact Us
                </Link>
              </div>
              
              {/* Stats */}
              <div className="flex gap-8 mt-8 justify-center md:justify-start">
                <div>
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm opacity-75">Products</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">10k+</div>
                  <div className="text-sm opacity-75">Customers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-sm opacity-75">Support</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500&h=500&fit=crop"
                alt="Shopping"
                className="rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>
      
      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <FaTruck className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Free Shipping</h3>
            <p className="text-gray-600">On orders over $50</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <FaUndo className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">30 Days Return</h3>
            <p className="text-gray-600">Money-back guarantee</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <FaShieldAlt className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Secure Shopping</h3>
            <p className="text-gray-600">100% secure transactions</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <FaHeadset className="text-4xl text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">24/7 Support</h3>
            <p className="text-gray-600">Dedicated assistance</p>
          </div>
        </div>
        
        {/* Banner Image 1 - Mid Page Banner */}
        <div className="relative mb-12 rounded-2xl overflow-hidden shadow-xl">
          <img 
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop"
            alt="Summer Sale"
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-blue-900/80 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Summer Sale!</h2>
              <p className="text-lg mb-6">Get up to 50% off on selected items</p>
              <Link
                to="/products"
                className="inline-block bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
        
        {/* Featured Products */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
          <Link to="/products" className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
            View All <span>→</span>
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="flex justify-between">
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
        
        {/* Banner Image 2 - Before Footer */}
        <div className="relative mt-12 rounded-2xl overflow-hidden shadow-xl">
          <img 
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=300&fit=crop"
            alt="Newsletter"
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-purple-900/80 flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">Subscribe to Our Newsletter</h2>
              <p className="text-sm md:text-base mb-5">Get the latest updates on new products and exclusive offers</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials Section */}
      <div className="bg-white py-12 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex text-yellow-400 mb-3">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-gray-600 mb-4">"Amazing products! Fast shipping and great customer service. Highly recommend ShopEase!"</p>
              <p className="font-semibold text-gray-800">- John D.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex text-yellow-400 mb-3">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-gray-600 mb-4">"Best shopping experience ever. The quality of products is outstanding."</p>
              <p className="font-semibold text-gray-800">- Sarah M.</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
              <div className="flex text-yellow-400 mb-3">
                <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
              </div>
              <p className="text-gray-600 mb-4">"Great selection of products at affordable prices. Will definitely shop again!"</p>
              <p className="font-semibold text-gray-800">- Michael R.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;