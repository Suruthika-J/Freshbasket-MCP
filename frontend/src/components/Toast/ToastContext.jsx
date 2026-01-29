// src/components/Toast/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo, FiShoppingCart, FiPackage } from 'react-icons/fi';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove toast after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 4000);
    
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      type: 'success',
      message,
      ...options
    });
  }, [addToast]);

  const showError = useCallback((message, options = {}) => {
    return addToast({
      type: 'error',
      message,
      ...options
    });
  }, [addToast]);

  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      type: 'info',
      message,
      ...options
    });
  }, [addToast]);

  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      type: 'warning',
      message,
      ...options
    });
  }, [addToast]);

  // Specific methods for cart and orders
  const showCartSuccess = useCallback((itemName, quantity = 1) => {
    return addToast({
      type: 'cart',
      message: `${itemName} ${quantity > 1 ? `(${quantity})` : ''} added to cart`,
      duration: 3000
    });
  }, [addToast]);

  const showOrderSuccess = useCallback((orderId) => {
    return addToast({
      type: 'order',
      message: `Order ${orderId} placed successfully!`,
      duration: 5000
    });
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showCartSuccess,
    showOrderSuccess
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast Container Component
const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast = ({ toast, onClose }) => {
  const { type, message, title } = toast;

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'cart':
        return 'bg-emerald-50 border-emerald-200 text-emerald-800';
      case 'order':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-500" />;
      case 'error':
        return <FiX className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <FiInfo className="w-5 h-5 text-blue-500" />;
      case 'cart':
        return <FiShoppingCart className="w-5 h-5 text-emerald-500" />;
      case 'order':
        return <FiPackage className="w-5 h-5 text-purple-500" />;
      default:
        return <FiInfo className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className={`
      max-w-sm w-full border rounded-lg shadow-lg p-4 
      transform transition-all duration-300 ease-in-out
      animate-slide-in-right
      ${getToastStyles()}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          {title && (
            <p className="text-sm font-medium mb-1">
              {title}
            </p>
          )}
          <p className="text-sm">
            {message}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS for animations (add to your main CSS file)
export const toastStyles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
`;
