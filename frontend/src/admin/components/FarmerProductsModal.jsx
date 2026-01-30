// frontend/src/admin/components/FarmerProductsModal.jsx
import React from 'react';
import { FiX, FiPackage, FiDollarSign, FiLayers } from 'react-icons/fi';
import { GiFarmer } from 'react-icons/gi';

const FarmerProductsModal = ({ isOpen, onClose, farmerData, loading }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatPrice = (price) => {
    return `₹${Number(price).toFixed(2)}`;
  };

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Out of Stock
        </span>
      );
    } else if (stock < 10) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Low Stock ({stock})
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          In Stock ({stock})
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <GiFarmer className="text-amber-600" size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? 'Loading...' : `${farmerData?.farmer?.name}'s Products`}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {loading 
                  ? 'Please wait...' 
                  : `${farmerData?.count || 0} ${farmerData?.count === 1 ? 'product' : 'products'} uploaded`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            disabled={loading}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Farmer Info Bar */}
        {!loading && farmerData?.farmer && (
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{farmerData.farmer.email}</p>
              </div>
              <div>
                <p className="text-gray-600">District</p>
                <p className="font-medium text-gray-900">{farmerData.farmer.district || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-gray-600">Certification</p>
                <p className="font-medium text-gray-900">{farmerData.farmer.certification || 'None'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            </div>
          ) : farmerData?.products?.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <FiPackage className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products uploaded yet
              </h3>
              <p className="text-gray-500">
                This farmer hasn't uploaded any products to the platform.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farmerData?.products?.map((product) => (
                <div
                  key={product._id}
                  className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className="h-48 bg-gray-100 overflow-hidden">
                      <img
                        src={`http://localhost:4000${product.imageUrl}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {/* Product Details */}
                  <div className="p-4 space-y-3">
                    {/* Product Name */}
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg mb-1">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="flex items-center gap-2">
                      <FiLayers className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">
                        {product.category}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2">
                      <FiDollarSign className="text-gray-400" size={16} />
                      <div className="flex items-baseline space-x-2">
                        <span className="text-lg font-bold text-emerald-600">
                          {formatPrice(product.price)}
                        </span>
                        {product.oldPrice && product.oldPrice > product.price && (
                          <>
                            <span className="text-sm line-through text-gray-500">
                              {formatPrice(product.oldPrice)}
                            </span>
                            <span className="text-xs font-medium text-green-600">
                              {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}% OFF
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stock & Unit */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        {getStockBadge(product.stock)}
                      </div>
                      <span className="text-xs text-gray-500">
                        Unit: {product.unit || 'kg'}
                      </span>
                    </div>

                    {/* Upload Date */}
                    <div className="text-xs text-gray-500">
                      Uploaded: {formatDate(product.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FarmerProductsModal;