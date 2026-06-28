// frontend/src/components/Footer.jsx (Simplified Version)
import React from 'react';
import { Link } from 'react-router';
import { FaStore, FaHeart } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <FaStore className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              ShopEase
            </span>
          </div>

          {/* Copyright */}
          <p className="text-gray-400 text-sm text-center">
            &copy; {currentYear} ShopEase. All rights reserved.
          </p>

          {/* Developer Credit */}
          <p className="text-gray-400 text-sm flex items-center gap-1">
            Developed with <FaHeart className="text-red-500 text-xs animate-pulse" /> by
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent font-semibold">
              Syed Muharram Ali
            </span>
          </p>
        </div>

        {/* Links */}
        <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-800">
          <Link to="/privacy" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
            Privacy Policy
          </Link>
          <Link to="/terms" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
            Terms of Service
          </Link>
          <Link to="/contact" className="text-gray-500 hover:text-purple-400 transition-colors text-xs">
            Contact
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-pulse {
          animation: pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;