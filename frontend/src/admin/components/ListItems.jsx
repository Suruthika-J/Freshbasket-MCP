// admin/src/components/ListItems.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiEdit, FiTrash2, FiPackage, FiFilter, FiX, FiSave, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { listItemsPageStyles as styles } from "../assets/adminStyles";
import StockModal from './StockModal';

const StatsCard = ({ icon: Icon, color, border, label, value, onClick, clickable }) => (
  <div 
    className={`${styles.statsCard(border)} ${clickable ? 'cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200' : ''}`}
    onClick={clickable ? onClick : undefined}
  >
    <div className={styles.statsCardInner}>
      <div className={styles.statsCardIconContainer(color)}>
        <Icon className={styles.statsCardIcon(color)} />
      </div>
      <div>
        <p className={styles.statsCardLabel}>{label}</p>
        <p className={styles.statsCardValue}>{value}</p>
      </div>
    </div>
  </div>
);

// Edit Modal Component
const EditProductModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    price: product?.price || '',
    oldPrice: product?.oldPrice || '',
    stock: product?.stock || 0,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.price || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (formData.oldPrice && Number(formData.oldPrice) < 0) {
      newErrors.oldPrice = 'Old price must be a positive number';
    }
    
    if (!formData.stock || Number(formData.stock) < 0) {
      newErrors.stock = 'Stock must be 0 or greater';
    }
    
    if (formData.oldPrice && Number(formData.oldPrice) < Number(formData.price)) {
      newErrors.oldPrice = 'Original price should be higher than selling price';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    setLoading(true);
    
    try {
      await onSave(product._id, {
        price: Number(formData.price),
        oldPrice: Number(formData.oldPrice) || null,
        stock: Number(formData.stock),
      });
      
      toast.success('✅ Product updated successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      onClose();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(`❌ Update failed: ${error.response?.data?.message || error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-emerald-800">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={loading}
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              <strong className="text-gray-900">Product:</strong> {product.name}
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Category: {product.category}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price (₹)
            </label>
            <input
              type="number"
              name="oldPrice"
              value={formData.oldPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              placeholder="Optional - for discount display"
              className={`w-full px-4 py-2 border ${errors.oldPrice ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none`}
            />
            {errors.oldPrice && (
              <p className="text-red-500 text-xs mt-1">{errors.oldPrice}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selling Price (₹) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className={`w-full px-4 py-2 border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none`}
            />
            {errors.price && (
              <p className="text-red-500 text-xs mt-1">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity *
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              required
              min="0"
              className={`w-full px-4 py-2 border ${errors.stock ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none`}
            />
            {errors.stock && (
              <p className="text-red-500 text-xs mt-1">{errors.stock}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Current stock: {product.stock} units
            </p>
          </div>

          {formData.price && (
            <div className="p-3 bg-emerald-50 rounded-lg">
              <p className="text-sm font-medium text-emerald-800 mb-1">Price Preview:</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-lg font-bold text-emerald-600">
                  ₹{Number(formData.price).toFixed(2)}
                </span>
                {formData.oldPrice && Number(formData.oldPrice) > Number(formData.price) && (
                  <>
                    <span className="text-sm line-through text-gray-500">
                      ₹{Number(formData.oldPrice).toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-green-600">
                      {Math.round(((Number(formData.oldPrice) - Number(formData.price)) / Number(formData.oldPrice)) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Stock Badge Component
const StockBadge = ({ stock }) => {
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

export default function ListItemsPage() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [downloadingCSV, setDownloadingCSV] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    lowStock: 0,
    outOfStock: 0
  });
  
  // Stock modal state
  const [stockModal, setStockModal] = useState({
    isOpen: false,
    type: null,
    items: [],
    title: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await axios.get('http://localhost:4000/api/items');
      const data = response.data;

      const withUrls = data.map(item => ({
        ...item,
        imageUrl: item.imageUrl
          ? `http://localhost:4000${item.imageUrl}`
          : null,
      }));

      const itemCategories = data.map(item => item.category);
      const uniqueCategories = ['All', ...new Set(itemCategories)];
      
      // Calculate stats
      const totalItems = withUrls.length;
      const lowStockItems = withUrls.filter(item => item.stock > 0 && item.stock < 10).length;
      const outOfStockItems = withUrls.filter(item => item.stock === 0).length;
      
      setStats({
        total: totalItems,
        lowStock: lowStockItems,
        outOfStock: outOfStockItems
      });
      
      setCategories(uniqueCategories);
      setItems(withUrls);
      setFilteredItems(withUrls);
    } catch (err) {
      console.error('Failed to load items:', err);
      toast.error('Could not load products. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.category === selectedCategory));
    }
  }, [selectedCategory, items]);

  const handleStockCardClick = async (type) => {
    try {
      const endpoint = type === 'low' 
        ? 'http://localhost:4000/api/items/low-stock'
        : 'http://localhost:4000/api/items/out-of-stock';
      
      const response = await axios.get(endpoint);
      
      setStockModal({
        isOpen: true,
        type,
        items: response.data,
        title: type === 'low' ? 'Low Stock Products' : 'Out of Stock Products'
      });
    } catch (error) {
      console.error('Failed to fetch stock details:', error);
      toast.error('Failed to load stock details', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const closeStockModal = () => {
    setStockModal({
      isOpen: false,
      type: null,
      items: [],
      title: ''
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleSave = async (productId, updatedData) => {
    try {
      const response = await axios.put(
        `http://localhost:4000/api/items/${productId}`,
        updatedData
      );

      await loadItems();
      
      return response.data;
    } catch (err) {
      console.error('Update failed:', err);
      throw err;
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
  
    try {
      await axios.delete(`http://localhost:4000/api/items/${id}`);
      
      setItems(prev => prev.filter(i => i._id !== id));
      setFilteredItems(prev => prev.filter(i => i._id !== id));
      
      toast.success('🗑️ Product deleted successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
      
      await loadItems();
    } catch (err) {
      console.error('Delete failed', err.response?.status, err.response?.data);
      toast.error(`Delete failed: ${err.response?.data?.message || err.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  // CSV Download Function
  const handleDownloadCSV = async () => {
    setDownloadingCSV(true);
    
    try {
      const response = await axios.get('http://localhost:4000/api/items/download');
      const products = response.data;

      if (!products || products.length === 0) {
        toast.warning('No products available to download', {
          position: "top-right",
          autoClose: 3000,
        });
        setDownloadingCSV(false);
        return;
      }

      // CSV Headers
      const headers = [
        'Product Name',
        'Category',
        'Description',
        'Original Price (₹)',
        'Selling Price (₹)',
        'Stock Quantity'
      ];

      // Convert products to CSV rows
      const csvRows = products.map(product => {
        return [
          `"${(product.name || '').replace(/"/g, '""')}"`,
          `"${(product.category || '').replace(/"/g, '""')}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          product.oldPrice || '',
          product.price || '',
          product.stock || 0
        ].join(',');
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `RushBasket_Stock_List_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('✅ Stock list downloaded successfully!', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error('CSV download failed:', error);
      toast.error(`❌ Failed to download stock list: ${error.response?.data?.message || error.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setDownloadingCSV(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerContainer}>
        <div className={styles.headerContainer}>
          <h1 className={styles.headerTitle}>Product Inventory</h1>
          <p className={styles.headerSubtitle}>Manage your product listings, stock, and pricing</p>
        </div>

        <div className={styles.statsGrid}>
          <StatsCard
            icon={FiPackage}
            color="bg-emerald-100"
            border="border-emerald-500"
            label="Total Products"
            value={stats.total}
            clickable={false}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatsCard
              icon={FiPackage}
              color="bg-yellow-100"
              border="border-yellow-500"
              label="Low Stock"
              value={stats.lowStock}
              onClick={() => handleStockCardClick('low')}
              clickable={true}
            />
            <StatsCard
              icon={FiPackage}
              color="bg-red-100"
              border="border-red-500"
              label="Out of Stock"
              value={stats.outOfStock}
              onClick={() => handleStockCardClick('out')}
              clickable={true}
            />
          </div>
        </div>

        <div className={styles.contentContainer}>
          <div className={styles.headerFlex}>
            <h2 className={styles.headerTitleSmall}>
              Products ({filteredItems.length})
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Download CSV Button */}
              <button
                onClick={handleDownloadCSV}
                disabled={downloadingCSV || items.length === 0}
                className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Download complete stock list as CSV"
              >
                {downloadingCSV ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Downloading...
                  </>
                ) : (
                  <>
                    <FiDownload className="mr-2" size={18} />
                    Download Stock List
                  </>
                )}
              </button>

              {/* Category Filter */}
              <div className={styles.filterContainer}>
                <div className={styles.filterSelectContainer}>
                  <div className={styles.filterIconContainer}>
                    <FiFilter className={styles.filterIcon} />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className={styles.filterSelect}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className={styles.filterSelectArrow}>
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIconContainer}>
                <FiPackage className={styles.emptyStateIcon} />
              </div>
              <h3 className={styles.emptyStateTitle}>
                No products found
              </h3>
              <p className={styles.emptyStateText}>
                {selectedCategory === 'All'
                  ? 'Try adding a new product.'
                  : `No products in ${selectedCategory} category.`}
              </p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead className={styles.tableHead}>
                  <tr>
                    <th className={styles.tableHeaderCell}>Product</th>
                    <th className={styles.tableHeaderCell}>Category</th>
                    <th className={styles.tableHeaderCell}>Price</th>
                    <th className={styles.tableHeaderCell}>Stock</th>
                    <th className={styles.tableHeaderCell}>Actions</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredItems.map(item => (
                    <tr key={item._id} className={styles.tableRowHover}>
                      <td className={styles.tableDataCell}>
                        <div className={styles.productCell}>
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className={styles.productImage}
                            />
                          ) : (
                            <div className={styles.placeholderImage} />
                          )}
                          <div>
                            <div className={styles.productName}>
                              {item.name}
                            </div>
                            {item.description && (
                              <div className={styles.productDescription}>
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={styles.tableDataCell}>
                        <span className={styles.categoryText}>
                          {item.category}
                        </span>
                      </td>
                      <td className={styles.tableDataCell}>
                        <div className={styles.price}>
                          ₹{item.price.toFixed(2)}
                        </div>
                        {item.oldPrice && item.oldPrice > item.price && (
                          <div className={styles.oldPrice}>
                            ₹{item.oldPrice.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className={styles.tableDataCell}>
                        <StockBadge stock={item.stock} />
                      </td>
                      <td className={styles.tableDataCell}>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() => handleEdit(item)}
                            className={styles.editButton}
                            title="Edit product price and stock"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className={styles.deleteButton}
                            title="Delete product"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSave}
        />
      )}

      {/* Stock Details Modal */}
      <StockModal
        isOpen={stockModal.isOpen}
        onClose={closeStockModal}
        items={stockModal.items}
        title={stockModal.title}
        type={stockModal.type}
      />
    </div>
  );
}