// frontend/src/components/ProductCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router';
import { FaEye, FaEnvelope, FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import EmailModal from './EmailModal';

const ProductCard = ({ product }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const getImageUrl = (imagePath) => {
    if (!imagePath) return 'https://via.placeholder.com/300?text=No+Image';
    const cleanPath = imagePath.replace(/\\/g, '/');
    return `http://localhost:5000/${cleanPath}`;
  };
  
  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="text-yellow-400 text-sm" />);
    }
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="text-yellow-400 text-sm" />);
    }
    while (stars.length < 5) {
      stars.push(<FaRegStar key={stars.length} className="text-yellow-400 text-sm" />);
    }
    return stars;
  };
  
  // Get first image from images array
  const productImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : null;
  
  return (
    <>
      <div className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden">
        <Link to={`/product/${product._id}`} className="block">
          <div className="relative h-56 overflow-hidden bg-gray-100">
            <img
              src={getImageUrl(productImage)}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110"
              onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=No+Image'}
            />
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                +{product.images.length} images
              </div>
            )}
          </div>
        </Link>
        
        <div className="p-4">
          <div className="mb-2">
            <span className="text-xs text-purple-600 font-semibold uppercase tracking-wide">
              {product.category}
            </span>
          </div>
          
          <Link to={`/product/${product._id}`}>
            <h3 className="text-base font-semibold text-gray-800 mb-2 hover:text-purple-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-center mb-2">
            <div className="flex">{renderRating(4.5)}</div>
            <span className="text-xs text-gray-500 ml-2">(128)</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
            </div>
           
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-1"
            >
              <FaEnvelope className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">Get Info</span>
            </button>
          </div>
        </div>
      </div>
      
      {showEmailModal && (
        <EmailModal product={product} onClose={() => setShowEmailModal(false)} />
      )}
    </>
  );
};

export default ProductCard;