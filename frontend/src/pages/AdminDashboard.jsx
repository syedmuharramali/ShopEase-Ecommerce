// frontend/src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  FaPlus, FaEdit, FaTrash, FaSpinner, FaBoxOpen, FaDollarSign, 
  FaTag, FaImage, FaShoppingCart, FaClock, FaCheckCircle, 
  FaTruck, FaTimesCircle 
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { adminInfo } = useSelector((state) => state.auth);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [stats, setStats] = useState({ 
    totalProducts: 0, 
    totalCategories: 0,
    totalOrders: 0,
    totalRevenue: 0
  });

  // Fetch products and orders
  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/products`);
      setProducts(response.data);
      const uniqueCategories = [...new Set(response.data.map(p => p.category).filter(Boolean))];
      setStats(prev => ({
        ...prev,
        totalProducts: response.data.length,
        totalCategories: uniqueCategories.length
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/order/`, {
        headers: { Authorization: `Bearer ${adminInfo?.token}` }
      });
      setOrders(response.data);
      const totalRevenue = response.data.reduce((sum, order) => sum + (order.subtotal || 0), 0);
      setStats(prev => ({
        ...prev,
        totalOrders: response.data.length,
        totalRevenue
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_BASE_URL}/products/${id}`, {
          headers: { Authorization: `Bearer ${adminInfo?.token}` }
        });
        setProducts(products.filter(p => p._id !== id));
        setStats(prev => ({ ...prev, totalProducts: prev.totalProducts - 1 }));
      } catch (error) {
        console.error('Delete error:', error);
        alert(error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_BASE_URL}/order/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${adminInfo?.token}` } }
      );
      // Refresh orders
      fetchOrders();
      alert(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update error:', error);
      alert(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    const cleanPath = imagePath.replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0]);
    }
    return null;
  };

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: FaClock, label: 'Pending' },
      confirmed: { color: 'bg-blue-100 text-blue-800', icon: FaCheckCircle, label: 'Confirmed' },
      processing: { color: 'bg-purple-100 text-purple-800', icon: FaSpinner, label: 'Processing' },
      shipped: { color: 'bg-indigo-100 text-indigo-800', icon: FaTruck, label: 'Shipped' },
      delivered: { color: 'bg-green-100 text-green-800', icon: FaCheckCircle, label: 'Delivered' },
      cancelled: { color: 'bg-red-100 text-red-800', icon: FaTimesCircle, label: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          {activeTab === 'products' && (
            <Link
              to="/admin/products/new"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <FaPlus />
              Add Product
            </Link>
          )}
        </div>
        
        {/* Stats Cards - added Total Orders and Total Revenue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Products</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FaBoxOpen className="text-purple-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Categories</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalCategories}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaTag className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FaShoppingCart className="text-green-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">₨ {stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FaDollarSign className="text-yellow-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex gap-2 px-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-4 font-medium transition-all duration-200 border-b-2 ${
                  activeTab === 'products'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaBoxOpen className="inline mr-2" />
                Products ({stats.totalProducts})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`py-4 px-4 font-medium transition-all duration-200 border-b-2 ${
                  activeTab === 'orders'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FaShoppingCart className="inline mr-2" />
                Orders ({stats.totalOrders})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Products Tab */}
            {activeTab === 'products' && (
              <>
                {loading ? (
                  <div className="p-12 text-center">
                    <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-12">
                    <FaBoxOpen className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No products yet</p>
                    <Link to="/admin/products/new" className="inline-block mt-4 text-purple-600 hover:text-purple-700">
                      Add your first product
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Images</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {products.map(product => {
                          const productImage = getProductImage(product);
                          return (
                            <tr key={product._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {productImage ? (
                                    <img
                                      src={productImage}
                                      alt={product.name}
                                      className="w-10 h-10 rounded-lg object-cover"
                                      onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=No+Image'}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                      <FaImage className="text-gray-400" />
                                    </div>
                                  )}
                                  <span className="font-medium text-gray-800 line-clamp-1">{product.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{product.category || 'Uncategorized'}</span>
                              </td>
                              <td className="px-6 py-4 font-semibold text-gray-800">₨ {product.price}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                  <FaImage className="text-gray-400" />
                                  <span className="text-sm text-gray-600">{product.images?.length || 0}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <Link to={`/admin/products/edit/${product._id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Product">
                                    <FaEdit />
                                  </Link>
                                  <button onClick={() => handleDeleteProduct(product._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Product">
                                    <FaTrash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <>
                {loading ? (
                  <div className="p-12 text-center">
                    <FaSpinner className="animate-spin text-4xl text-purple-600 mx-auto" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {orders.map(order => (
                          <tr key={order._id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.orderNumber || order._id.slice(-8)}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-800">{order.name}</p>
                                <p className="text-xs text-gray-500">{order.email}</p>
                              </div>
                             </td>
                            <td className="px-4 py-3">
                              {order.product ? (
                                <div className="flex items-center gap-2">
                                  {order.product.images && order.product.images[0] && (
                                    <img src={getImageUrl(order.product.images[0])} alt="" className="w-8 h-8 rounded object-cover" />
                                  )}
                                  <span className="text-sm text-gray-700 line-clamp-1">{order.product.name}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">N/A</span>
                              )}
                             </td>
                            <td className="px-4 py-3 text-center">{order.quantity}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">₨ {order.subtotal}</td>
                            <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                            <td className="px-4 py-3">
                              <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                className="text-xs border rounded px-2 py-1 focus:ring-purple-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                             </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;