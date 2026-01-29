// ============================================
// FILE: frontend/src/components/InvoiceDownload.jsx
// Reusable Invoice Download Component
// ============================================
import React, { useState } from 'react';
import axios from 'axios';
import { FiDownload, FiLoader } from 'react-icons/fi';

/**
 * Reusable Invoice Download Component
 * @param {string} orderId - MongoDB _id of the order
 * @param {string} orderNumber - Human-readable order ID (e.g., ORD-12345)
 * @param {string} className - Optional CSS classes
 * @param {boolean} showIcon - Show download icon (default: true)
 * @param {function} onSuccess - Callback on successful download
 * @param {function} onError - Callback on download error
 */
const InvoiceDownload = ({ 
    orderId, 
    orderNumber, 
    className = '',
    showIcon = true,
    onSuccess,
    onError,
    children
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    const downloadInvoice = async () => {
        if (!orderId) {
            const error = 'Order ID is required';
            console.error('❌', error);
            if (onError) onError(error);
            return;
        }

        setIsDownloading(true);

        try {
            console.log('📄 Downloading invoice for order:', orderId);
            const token = localStorage.getItem('authToken');
            
            const response = await axios({
                url: `${apiUrl}/api/orders/${orderId}/invoice`,
                method: 'GET',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                responseType: 'blob',
                timeout: 15000 // 15 second timeout
            });

            console.log('✅ Invoice data received, size:', response.data.size, 'bytes');

            // Create blob with explicit PDF type
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = `Invoice_${orderNumber || orderId}.pdf`;
            link.setAttribute('download', `Invoice_${orderNumber || orderId}.pdf`);
            
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

            console.log('✅ Invoice downloaded successfully');
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error('❌ Invoice download error:', error);
            
            let errorMessage = 'Failed to download invoice';
            
            if (error.response) {
                errorMessage = error.response.data?.message || errorMessage;
            } else if (error.request) {
                errorMessage = 'Network error. Please check your connection.';
            }
            
            if (onError) onError(errorMessage);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <button
            onClick={downloadInvoice}
            disabled={isDownloading}
            className={className || "flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"}
        >
            {isDownloading ? (
                <>
                    <FiLoader className="animate-spin" size={18} />
                    <span>Downloading...</span>
                </>
            ) : (
                <>
                    {showIcon && <FiDownload size={18} />}
                    {children || <span>Download Invoice</span>}
                </>
            )}
        </button>
    );
};

export default InvoiceDownload;