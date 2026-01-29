// admin/src/components/StockModal.jsx
import React from 'react';
import { FiX, FiPackage, FiAlertTriangle } from 'react-icons/fi';

const StockModal = ({ isOpen, onClose, items, title, type }) => {
  if (!isOpen) return null;

  const isLowStock = type === 'low';
  const isOutOfStock = type === 'out';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {isLowStock && (
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FiAlertTriangle className="text-yellow-600" size={24} />
              </div>
            )}
            {isOutOfStock && (
              <div className="p-2 bg-red-100 rounded-lg">
                <FiPackage className="text-red-600" size={24} />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {items.length} {items.length === 1 ? 'product' : 'products'} found
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                <FiPackage className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                {isLowStock && "All products have adequate stock levels."}
                {isOutOfStock && "All products are currently in stock."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item._id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <div className="flex items-center space-x-3 mt-1">
                      <span className="text-sm text-gray-500">
                        Category: <span className="font-medium text-gray-700">{item.category || 'N/A'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {isLowStock && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        {item.stock} {item.stock === 1 ? 'unit' : 'units'} left
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Out of Stock
                      </span>
                    )}
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
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockModal;