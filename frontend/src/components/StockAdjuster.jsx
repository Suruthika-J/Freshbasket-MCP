import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const StockAdjuster = ({ productId, initialStock, onStockUpdate }) => {
  const [stock, setStock] = useState(initialStock);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState(''); // 'increase', 'decrease', 'shake'
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setStock(initialStock);
  }, [initialStock]);

  const updateStock = async (newStock) => {
    if (isUpdating) return;

    setIsUpdating(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.patch(
        `${API_BASE_URL}/api/products/${productId}/stock`,
        { stock: newStock },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setStock(newStock);
        onStockUpdate?.(productId, newStock);

        // Trigger animation
        if (newStock > stock) {
          setAnimationType('increase');
        } else if (newStock < stock) {
          setAnimationType('decrease');
        }

        setIsAnimating(true);
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationType('');
        }, 600);

      } else {
        toast.error('Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error(error.response?.data?.message || 'Failed to update stock');

      // Shake animation for error
      setAnimationType('shake');
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType('');
      }, 600);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrease = () => {
    updateStock(stock + 1);
  };

  const handleDecrease = () => {
    if (stock > 0) {
      updateStock(stock - 1);
    } else {
      // Shake animation when trying to go below 0
      setAnimationType('shake');
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationType('');
      }, 600);
    }
  };

  const getStockNumberClasses = () => {
    let classes = 'text-2xl font-bold transition-all duration-300 select-none ';

    if (isAnimating) {
      switch (animationType) {
        case 'increase':
          classes += 'text-green-600 scale-110 animate-pulse';
          break;
        case 'decrease':
          classes += 'text-red-600 scale-90 animate-pulse';
          break;
        case 'shake':
          classes += 'text-red-600 animate-bounce';
          break;
        default:
          classes += 'text-gray-900';
      }
    } else {
      classes += stock === 0 ? 'text-red-600' : 'text-gray-900';
    }

    return classes;
  };

  const getMinusIconClasses = () => {
    let classes = 'w-8 h-8 transition-all duration-200 ';

    if (stock === 0) {
      classes += 'text-gray-300 cursor-not-allowed';
    } else {
      classes += 'text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer rounded-full p-1';
    }

    if (isUpdating) {
      classes += ' opacity-50';
    }

    return classes;
  };

  const getPlusIconClasses = () => {
    let classes = 'w-8 h-8 transition-all duration-200 text-green-500 hover:text-green-700 hover:bg-green-50 cursor-pointer rounded-full p-1';

    if (isUpdating) {
      classes += ' opacity-50';
    }

    return classes;
  };

  return (
    <div className="flex items-center justify-center gap-3 py-2">
      {/* Minus Button */}
      <button
        onClick={handleDecrease}
        disabled={stock === 0 || isUpdating}
        className={getMinusIconClasses()}
        title="Decrease stock"
      >
        <FiMinus />
      </button>

      {/* Stock Number */}
      <div className="flex items-center justify-center min-w-[60px]">
        <span className={getStockNumberClasses()}>
          {stock}
        </span>
      </div>

      {/* Plus Button */}
      <button
        onClick={handleIncrease}
        disabled={isUpdating}
        className={getPlusIconClasses()}
        title="Increase stock"
      >
        <FiPlus />
      </button>
    </div>
  );
};

export default StockAdjuster;
