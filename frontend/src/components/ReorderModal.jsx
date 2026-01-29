// ============================================
// FILE: frontend/src/components/ReorderModal.jsx
// NEW COMPONENT
// ============================================

import React, { useState } from 'react';
import { FiX, FiAlertTriangle, FiCheck, FiPackage } from 'react-icons/fi';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useCart } from '../CartContext';

const ReorderModal = ({ isOpen, onClose, order }) => {
  const [loading, setLoading] = useState(false);
  const [reorderData, setReorderData] = useState(null);
  const { addToCart } = useCart();

  const handleReorder = async () => {
    if (!order?._id) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to reorder');
        onClose();
        setLoading(false);
        return;
      }

      console.log(`🔄 Fetching reorder data for order: ${order._id}`);

      const response = await axios.get(
        `http://localhost:4000/api/orders/${order._id}/reorder`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        toast.error(response.data.message || 'Failed to fetch reorder data');
        setLoading(false);
        return;
      }

      setReorderData(response.data.data);
      
      // Add items to cart
      const { items, stockStatus } = response.data.data;
      
      let addedCount = 0;
      for (const item of items) {
        try {
          await addToCart({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl
          });
          addedCount++;
        } catch (err) {
          console.error(`Failed to add ${item.name} to cart:`, err);
        }
      }

      // Show notification based on results
      if (stockStatus.length === 0) {
        toast.success(`✅ All ${addedCount} items added to cart!`, {
          position: 'top-right',
          autoClose: 3000
        });
      } else {
        const outOfStock = stockStatus.filter(s => s.status === 'out_of_stock').length;
        const discontinued = stockStatus.filter(s => s.status === 'discontinued').length;
        
        let message = `✅ Added ${addedCount} items to cart. `;
        if (outOfStock > 0) message += `${outOfStock} item(s) out of stock. `;
        if (discontinued > 0) message += `${discontinued} item(s) discontinued.`;
        
        toast.warning(message, {
          position: 'top-right',
          autoClose: 4000
        });
      }

      // Close modal and redirect after slight delay
      setTimeout(() => {
        onClose();
        window.location.href = '/cart';
      }, 1500);

    } catch (err) {
      console.error('❌ Reorder error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to process reorder';
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Quick Reorder</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-gray-600">Processing your reorder...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-gray-700">
                  You're about to reorder all items from <strong>{order.orderId}</strong> placed on{' '}
                  <strong>{new Date(order.createdAt || order.date).toLocaleDateString()}</strong>.
                </p>
              </div>

              {/* Items Summary */}
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiPackage size={18} />
                  Items ({order.items?.length || 0})
                </h3>
                <div className="space-y-2">
                  {order.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-start text-sm border-l-2 border-emerald-500 pl-3 py-1"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-gray-600 text-xs">
                          ₹{item.price?.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-800">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stock Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                <FiAlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <p className="font-medium text-amber-900">Note:</p>
                  <p className="text-amber-800">
                    Some items may be out of stock or prices may have changed since the original order.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleReorder}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <FiCheck size={18} />
            {loading ? 'Processing...' : 'Reorder Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReorderModal;