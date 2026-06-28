// frontend/src/components/Navbar.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../slices/authSlice';
import { FaStore, FaBoxOpen, FaSignInAlt, FaSignOutAlt, FaUser, FaTachometerAlt, FaEnvelope, FaBars, FaTimes, FaHome } from 'react-icons/fa';

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { adminInfo } = useSelector((state) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    setIsMenuOpen(false);
  };

  const closeMenu = () => setIsMenuOpen(false);

  // Active link styling function
  const getActiveClass = ({ isActive }) => {
    return isActive
      ? 'text-purple-600 bg-purple-50 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200'
      : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200';
  };

  const getMobileActiveClass = ({ isActive }) => {
    return isActive
      ? 'bg-purple-50 text-purple-600 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200'
      : 'text-gray-700 hover:bg-gray-50 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200';
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <NavLink to="/" className="flex items-center space-x-2 group" onClick={closeMenu}>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                <FaStore className="text-white text-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ShopEase
              </span>
            </NavLink>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" className={getActiveClass} end>
                <FaHome className="text-lg" />
                <span>Home</span>
              </NavLink>
              
              <NavLink to="/products" className={getActiveClass}>
                <FaBoxOpen className="text-lg" />
                <span>Products</span>
              </NavLink>
              
              <NavLink to="/contact" className={getActiveClass}>
                <FaEnvelope className="text-lg" />
                <span>Contact</span>
              </NavLink>
              
              {adminInfo ? (
                <div className="flex items-center gap-2 ml-2">
                  <NavLink to="/admin/dashboard" className={getActiveClass}>
                    <FaTachometerAlt className="text-lg" />
                    <span>Dashboard</span>
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <NavLink to="/admin/login" className={({ isActive }) => 
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2'
                }>
                  <FaUser />
                  <span>Admin Login</span>
                </NavLink>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeMenu}>
          <div className="absolute top-16 right-0 w-64 bg-white shadow-xl rounded-bl-2xl p-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col gap-2">
              <NavLink to="/" onClick={closeMenu} className={getMobileActiveClass} end>
                <FaHome className="text-xl" />
                <span className="font-medium">Home</span>
              </NavLink>
              
              <NavLink to="/products" onClick={closeMenu} className={getMobileActiveClass}>
                <FaBoxOpen className="text-xl" />
                <span className="font-medium">Products</span>
              </NavLink>
              
              <NavLink to="/contact" onClick={closeMenu} className={getMobileActiveClass}>
                <FaEnvelope className="text-xl" />
                <span className="font-medium">Contact</span>
              </NavLink>
              
              {adminInfo ? (
                <>
                  <NavLink to="/admin/dashboard" onClick={closeMenu} className={getMobileActiveClass}>
                    <FaTachometerAlt className="text-xl" />
                    <span className="font-medium">Dashboard</span>
                  </NavLink>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                    <FaSignOutAlt className="text-xl" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <NavLink to="/admin/login" onClick={closeMenu} className={({ isActive }) =>
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center gap-3 px-4 py-3 rounded-lg'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all duration-200 flex items-center gap-3 px-4 py-3 rounded-lg'
                }>
                  <FaUser className="text-xl" />
                  <span className="font-medium">Admin Login</span>
                </NavLink>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;