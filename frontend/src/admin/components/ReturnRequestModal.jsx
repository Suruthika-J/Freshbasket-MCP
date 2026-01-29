// ============================================
// FILE: frontend/src/components/ReturnRequestModal.jsx
// Path: frontend/src/components/ReturnRequestModal.jsx
// ============================================

import React, { useState } from 'react';
import { FiX, FiAlertTriangle, FiPackage, FiCheck } from 'react-icons/fi';
import axios from 'axios';

const ReturnRequestModal = ({ isOpen, onClose, order, onReturnRequested }) => {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (reason.trim().length < 10) {
            setError('Please provide a reason with at least 10 characters');
            setLoading(false);
            return;
        }

        if (reason.trim().length > 500) {
            setError('Reason must not exceed 500 characters');
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                'http://localhost:4000/api/returns',
                {
                    orderId: order._id,
                    reason: reason.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    if (onReturnRequested) {
                        onReturnRequested(response.data.returnRequest);
                    }
                    handleClose();
                }, 2000);
            }
        } catch (err) {
            console.error('Return request error:', err);
            setError(
                err.response?.data?.message || 
                'Failed to submit return request. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setError('');
        setSuccess(false);
        onClose();
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-4 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <FiPackage className="text-white text-2xl" />
                            <div>
                                <h2 className="text-xl font-semibold text-white">
                                    Request Return
                                </h2>
                                <p className="text-orange-100 text-sm">
                                    Order: {order.orderId}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white hover:text-orange-200 transition-colors"
                            disabled={loading}
                        >
                            <FiX size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">
                    <div className="p-6">
                        {success ? (
                            // Success Message
                            <div className="text-center py-8">
                                <div className="mb-4 flex justify-center">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                        <FiCheck className="text-green-600 text-3xl" />
                                    </div>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    Return Request Submitted!
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    Your return request has been submitted successfully.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Our team will review your request and get back to you soon.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Warning Notice */}
                                <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-lg">
                                    <div className="flex items-start">
                                        <FiAlertTriangle className="text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
                                        <div>
                                            <h4 className="text-sm font-semibold text-orange-800 mb-1">
                                                Return Policy
                                            </h4>
                                            <ul className="text-sm text-orange-700 space-y-1">
                                                <li>• Returns accepted within 7 days of delivery</li>
                                                <li>• Items must be in original condition</li>
                                                <li>• Refund will be processed after inspection</li>
                                                <li>• Perishable items may not be eligible for return</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                    <h3 className="font-semibold text-gray-900 mb-3">
                                        Order Summary
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Total Items:</span>
                                            <span className="font-medium text-gray-900">
                                                {order.items?.length || 0} items
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Order Total:</span>
                                            <span className="font-medium text-gray-900">
                                                ₹{order.total?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Method:</span>
                                            <span className="font-medium text-gray-900">
                                                {order.paymentMethod}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Return Reason Form */}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-6">
                                        <label 
                                            htmlFor="reason" 
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Reason for Return <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="reason"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Please describe the reason for returning this order (minimum 10 characters)..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                                            rows="5"
                                            maxLength="500"
                                            required
                                            disabled={loading}
                                        />
                                        <div className="flex justify-between mt-2">
                                            <span className={`text-xs ${
                                                reason.length < 10 
                                                    ? 'text-red-500' 
                                                    : 'text-gray-500'
                                            }`}>
                                                {reason.length < 10 
                                                    ? `${10 - reason.length} more characters required`
                                                    : 'Minimum requirement met'
                                                }
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {reason.length}/500
                                            </span>
                                        </div>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                                            <div className="flex items-center">
                                                <FiAlertTriangle className="text-red-500 mr-2 flex-shrink-0" />
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                            disabled={loading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            disabled={loading || reason.trim().length < 10}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                'Submit Return Request'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnRequestModal;