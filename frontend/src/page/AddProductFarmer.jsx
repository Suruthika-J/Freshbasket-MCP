// frontend/src/page/AddProductFarmer.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiSave, FiArrowLeft, FiCamera } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import VoiceInput from '../components/VoiceInput/VoiceInput';
import CameraCapture from '../components/CameraCapture/CameraCapture';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
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

  const processImageFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Image size (${formatFileSize(file.size)}) exceeds the 2MB limit. Please choose a smaller image.`);
      return;
    }

    // Clear image error if any
    if (errors.image) {
      setErrors((prev) => ({ ...prev, image: '' }));
    }

    setFormData((prev) => ({
      ...prev,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const handleImageUpload = (e) => {
    processImageFile(e.target.files[0]);
  };

  const handleCameraCapture = (file) => {
    processImageFile(file);
    setIsCameraOpen(false);
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null, preview: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
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
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  style={{
                    background: 'var(--color-input-bg)',
                    color: 'var(--color-text)',
                    borderColor: 'var(--color-input-border)',
                  }}
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
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

            {/* ─── Image Upload with Camera Support ─── */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                📸 Product Image *
              </label>

              {formData.preview ? (
                /* ── Image Preview ── */
                <div
                  className="mt-1 rounded-lg p-4 border-2 transition-colors"
                  style={{
                    borderColor: 'var(--color-primary)',
                    background: 'var(--color-primary-subtle)',
                  }}
                >
                  <div className="relative">
                    <img
                      src={formData.preview}
                      alt="Product preview"
                      className="w-full max-h-56 object-contain rounded-lg mx-auto"
                      style={{ background: 'var(--color-surface)' }}
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove image"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                  {formData.image && (
                    <div className="mt-2 flex items-center justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <span className="truncate mr-2">📄 {formData.image.name}</span>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {formatFileSize(formData.image.size)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Upload / Camera Buttons ── */
                <div
                  className="mt-1 flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors"
                  style={{
                    borderColor: errors.image
                      ? 'var(--color-error)'
                      : 'var(--color-border)',
                    background: 'var(--color-surface-alt)',
                  }}
                >
                  <FiUpload
                    className="mx-auto h-12 w-12 mb-3"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                  <p
                    className="text-sm mb-4"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Upload from device or capture with camera
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Upload from device */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-colors font-medium text-sm text-white"
                      style={{ background: 'var(--color-primary)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <FiUpload size={16} />
                      Upload Image
                    </button>

                    {/* Capture from camera */}
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg transition-colors font-medium text-sm text-white"
                      style={{ background: '#2563eb' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                      <FiCamera size={16} />
                      Take Photo
                    </button>
                  </div>
                  <p className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
                    JPG, PNG, GIF, WebP — max 2 MB
                  </p>
                </div>
              )}

              {errors.image && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-error)' }}>
                  {errors.image}
                </p>
              )}

              {/* Hidden file input for gallery/file upload */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="sr-only"
              />

              {/* Camera Capture Modal */}
              <CameraCapture
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCameraCapture}
              />
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