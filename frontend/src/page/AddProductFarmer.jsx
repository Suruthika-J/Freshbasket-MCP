// frontend/src/page/AddProductFarmer.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiSave, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput/VoiceInput';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const initialFormState = {
  name: '',
  description: '',
  category: '',
  oldPrice: '',
  price: '',
  stock: '',
  unit: '',
  image: null,
  preview: '',
};

const categories = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Beverages',
  'Snacks',
  'Seafood',
  'Bakery',
  'Meat',
];

const units = [
  'kg',
  'grams',
  'litres',
  'ml',
  'pieces',
  'dozen',
  'bundle',
  'packet',
];

const AddProductFarmer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef();

  // Generic field change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Voice-result handler for a specific field
  const handleVoiceChange = (fieldName, newValue) => {
    setFormData((prev) => ({ ...prev, [fieldName]: newValue }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null, preview: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.price || Number(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (formData.oldPrice && Number(formData.oldPrice) <= 0) {
      newErrors.oldPrice = 'Old price must be a positive number';
    }

    if (formData.oldPrice && Number(formData.oldPrice) <= Number(formData.price)) {
      newErrors.oldPrice = 'Old price must be greater than current price';
    }

    if (!formData.stock || Number(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    if (!formData.image) {
      newErrors.image = 'Product image is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('price', formData.price);
      submitData.append('stock', formData.stock);
      if (formData.unit) {
        submitData.append('unit', formData.unit);
      }
      if (formData.oldPrice) {
        submitData.append('oldPrice', formData.oldPrice);
      }
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const response = await axios.post(`${API_BASE_URL}/api/products`, submitData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Product added successfully!');
        navigate('/farmer-dashboard');
      } else {
        toast.error(response.data.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/farmer-dashboard');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="flex items-center mb-4"
            style={{
              color: 'var(--color-text-secondary)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = 'var(--color-text-secondary)')
            }
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
          <h1
            className="text-3xl font-bold"
            style={{ color: 'var(--color-text)' }}
          >
            🌾 Add New Product
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
            Fill in the details below. Use the{' '}
            <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              🎙️ mic button
            </span>{' '}
            to speak in Tamil or English.
          </p>
        </div>

        {/* Form */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ─── Product Name ─── */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                🏷️ Product Name *
              </label>
              <VoiceInput
                value={formData.name}
                onChange={(val) => handleVoiceChange('name', val)}
                fieldName="Product Name"
                placeholder="Enter product name (e.g., Tomato / தக்காளி)"
                error={errors.name}
                inputProps={{ name: 'name' }}
              />
              {errors.name && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* ─── Description ─── */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                📝 Description *
              </label>
              <VoiceInput
                value={formData.description}
                onChange={(val) => handleVoiceChange('description', val)}
                fieldName="Description"
                placeholder="Describe your product..."
                multiline
                rows={4}
                appendMode
                error={errors.description}
                inputProps={{ name: 'description' }}
              />
              {errors.description && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.description}
                </p>
              )}
            </div>

            {/* ─── Category ─── */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                📂 Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                style={{
                  background: 'var(--color-input-bg)',
                  color: 'var(--color-text)',
                  borderColor: errors.category
                    ? 'var(--color-error)'
                    : 'var(--color-input-border)',
                }}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.category}
                </p>
              )}
            </div>

            {/* ─── Quantity & Unit ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="stock"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  📦 Stock Quantity *
                </label>
                <VoiceInput
                  value={formData.stock}
                  onChange={(val) => {
                    // Extract numbers from voice input
                    const numericVal = val.replace(/[^0-9.]/g, '');
                    handleVoiceChange('stock', numericVal || val);
                  }}
                  fieldName="Stock Quantity"
                  placeholder="e.g., 100"
                  inputType="number"
                  error={errors.stock}
                  showLangPicker={false}
                  inputProps={{ name: 'stock', min: '0' }}
                />
                {errors.stock && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                    {errors.stock}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="unit"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  ⚖️ Unit
                </label>
                <VoiceInput
                  value={formData.unit}
                  onChange={(val) => {
                    // Smart unit mapping from voice
                    const unitMap = {
                      'கிலோ': 'kg',
                      'கிலோகிராம்': 'kg',
                      'கிராம்': 'grams',
                      'லிட்டர்': 'litres',
                      'மில்லி': 'ml',
                      'kilo': 'kg',
                      'kilogram': 'kg',
                      'gram': 'grams',
                      'litre': 'litres',
                      'liter': 'litres',
                      'milli': 'ml',
                      'millilitre': 'ml',
                      'piece': 'pieces',
                      'dozen': 'dozen',
                      'bundle': 'bundle',
                      'packet': 'packet',
                    };
                    const lowered = val.toLowerCase().trim();
                    const mapped = unitMap[lowered] || val;
                    handleVoiceChange('unit', mapped);
                  }}
                  fieldName="Unit"
                  placeholder="kg, grams, litres..."
                  error={errors.unit}
                  showLangPicker={false}
                  inputProps={{ name: 'unit', list: 'unit-options' }}
                />
                <datalist id="unit-options">
                  {units.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* ─── Price Fields ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  💰 Price (₹) *
                </label>
                <VoiceInput
                  value={formData.price}
                  onChange={(val) => {
                    const numericVal = val.replace(/[^0-9.]/g, '');
                    handleVoiceChange('price', numericVal || val);
                  }}
                  fieldName="Price"
                  placeholder="0.00"
                  inputType="number"
                  error={errors.price}
                  showLangPicker={false}
                  inputProps={{ name: 'price', min: '0', step: '0.01' }}
                />
                {errors.price && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="oldPrice"
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  🏷️ Old Price (₹){' '}
                  <span style={{ color: 'var(--color-text-muted)' }}>(optional)</span>
                </label>
                <VoiceInput
                  value={formData.oldPrice}
                  onChange={(val) => {
                    const numericVal = val.replace(/[^0-9.]/g, '');
                    handleVoiceChange('oldPrice', numericVal || val);
                  }}
                  fieldName="Old Price"
                  placeholder="0.00"
                  inputType="number"
                  error={errors.oldPrice}
                  showLangPicker={false}
                  inputProps={{ name: 'oldPrice', min: '0', step: '0.01' }}
                />
                {errors.oldPrice && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                    {errors.oldPrice}
                  </p>
                )}
              </div>
            </div>

            {/* ─── Image Upload ─── */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                📸 Product Image *
              </label>
              <div
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors"
                style={{
                  borderColor: errors.image
                    ? 'var(--color-error)'
                    : 'var(--color-border)',
                  background: 'var(--color-surface-alt)',
                }}
              >
                {formData.preview ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={formData.preview}
                        alt="Product preview"
                        className="max-w-xs max-h-48 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 text-center">
                    <FiUpload
                      className="mx-auto h-12 w-12"
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                    <div
                      className="flex text-sm"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <label
                        htmlFor="image-upload"
                        className="relative cursor-pointer rounded-md font-medium focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        <span>Upload an image</span>
                        <input
                          id="image-upload"
                          name="image"
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                )}
              </div>
              {errors.image && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.image}
                </p>
              )}
            </div>

            {/* ─── Submit Button ─── */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="fb-btn-primary"
                style={{
                  padding: '0.75rem 2rem',
                  fontSize: '1rem',
                  borderRadius: '12px',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <>
                    <div className="animate-fb-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    Adding Product...
                  </>
                ) : (
                  <>
                    <FiSave className="w-5 h-5" />
                    Add Product
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Voice Input Tips ─── */}
        <div
          className="mt-6 rounded-xl p-5"
          style={{
            background: 'var(--color-primary-subtle)',
            border: '1px solid var(--color-primary)',
            borderLeftWidth: '4px',
          }}
        >
          <h3
            className="font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}
          >
            🎙️ Voice Input Tips
          </h3>
          <ul
            className="space-y-2 text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <li className="flex items-start gap-2">
              <span>🗣️</span>
              <span>
                <strong>Speak clearly</strong> — Say the value you want to fill in the field.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>🌐</span>
              <span>
                <strong>Tamil & English supported</strong> — நீங்கள் தமிழிலும் பேசலாம்.
                Switch between languages freely.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>🔢</span>
              <span>
                <strong>Numbers</strong> — For price and quantity, speak the number
                (e.g., "fifty" or "ஐம்பது"). The system will extract digits.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>⚖️</span>
              <span>
                <strong>Units</strong> — Say "kilo", "கிலோ", "gram", "litre" etc.
                They&apos;ll be auto-mapped.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>🛑</span>
              <span>
                <strong>Tap the mic again</strong> to stop recording at any time.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AddProductFarmer;