// File: AddItem.jsx
// Path: frontend/src/admin/components/AddItem.jsx

import React, { useState, useRef } from "react";
import axios from "axios";
import { FiUpload, FiX, FiSave, FiCamera } from "react-icons/fi";
import { addItemPageStyles as styles } from "../assets/adminStyles";
import CameraCapture from "../../components/CameraCapture/CameraCapture";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const initialFormState = {
  name: "",
  description: "",
  category: "",
  oldPrice: "",
  price: "",
  stock: "",
  unit: "kg",
  image: null,
  preview: "",
  visibleDistricts: []
};

const categories = [
  "Fruits",
  "Vegetables",
  "Dairy",
  "Beverages",
  "Snacks",
  "Seafood",
  "Bakery",
  "Meat",
];

const units = [
  "kg",
  "grams",
  "litres",
  "ml",
  "pieces",
  "dozen",
  "bundle",
  "packet",
];

// Tamil Nadu Districts
const tamilNaduDistricts = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam",
  "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram",
  "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur",
  "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur",
  "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
  "Viluppuram", "Virudhunagar"
];

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function AddItemPage() {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleDistrictToggle = (district) => {
    setFormData((prev) => {
      const isSelected = prev.visibleDistricts.includes(district);
      return {
        ...prev,
        visibleDistricts: isSelected
          ? prev.visibleDistricts.filter(d => d !== district)
          : [...prev.visibleDistricts, district]
      };
    });
  };

  const handleSelectAllDistricts = () => {
    if (formData.visibleDistricts.length === tamilNaduDistricts.length) {
      setFormData(prev => ({ ...prev, visibleDistricts: [] }));
    } else {
      setFormData(prev => ({ ...prev, visibleDistricts: [...tamilNaduDistricts] }));
    }
  };

  const processImageFile = (file) => {
    if (!file) return;

    setImageError("");

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError(`Image size (${formatFileSize(file.size)}) exceeds the 2MB limit. Please choose a smaller image.`);
      return;
    }

    setFormData((f) => ({
      ...f,
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
    setImageError("");
    setFormData((f) => ({ ...f, image: null, preview: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.visibleDistricts.length === 0) {
      alert('Please select at least one district where this product will be visible');
      return;
    }

    setLoading(true);
    try {
      let token = null;
      const sessionData = localStorage.getItem('adminSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        token = session.token;
      }

      if (!token) {
        token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      }

      const body = new FormData();
      body.append("name", formData.name);
      body.append("description", formData.description);
      body.append("category", formData.category);
      body.append("oldPrice", formData.oldPrice);
      body.append("price", formData.price);
      body.append("stock", formData.stock);
      body.append("unit", formData.unit);
      body.append("visibleDistricts", JSON.stringify(formData.visibleDistricts));

      if (formData.image) {
        body.append("image", formData.image);
      }

      const res = await axios.post("http://localhost:4000/api/items", body, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        },
      });

      console.log("Created", res.data);
      alert(`Product added successfully! Visible in ${formData.visibleDistricts.length} district(s)`);
      setFormData(initialFormState);
      setImageError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const { name, description, category, oldPrice, price, stock, preview, visibleDistricts } = formData;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerContainer}>
        <h1 className={styles.heading}>Add New Product (Admin)</h1>
        <p className="text-sm text-gray-600 mb-6">Select districts where this product will be visible to customers</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.gridContainer}>
            <div>
              <label className={styles.label}>Product Name *</label>
              <input
                type="text"
                name="name"
                value={name}
                onChange={handleChange}
                required
                className={styles.input}
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className={styles.label}>Category *</label>
              <select
                name="category"
                value={category}
                onChange={handleChange}
                required
                className={styles.input}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={description}
              onChange={handleChange}
              rows="3"
              className={styles.textarea}
              placeholder="Enter product description (optional)"
            />
          </div>

          <div className={styles.priceGrid}>
            <div>
              <label className={styles.label}>Original Price (₹) *</label>
              <input
                type="number"
                name="oldPrice"
                value={oldPrice}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={styles.input}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={styles.label}>Selling Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className={styles.input}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className={styles.label}>Stock Quantity *</label>
              <input
                type="number"
                name="stock"
                value={stock}
                onChange={handleChange}
                required
                min="0"
                className={styles.input}
                placeholder="0"
              />
            </div>

            <div>
              <label className={styles.label}>⚖️ Unit *</label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className={styles.input}
              >
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* District Selection */}
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Visible Districts * <span className="text-xs text-gray-500">({visibleDistricts.length} selected)</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAllDistricts}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {visibleDistricts.length === tamilNaduDistricts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border border-gray-200">
              {tamilNaduDistricts.map((district) => (
                <label
                  key={district}
                  className={`flex items-center p-2 rounded cursor-pointer transition-colors ${visibleDistricts.includes(district)
                      ? 'bg-green-100 border border-green-400'
                      : 'bg-white border border-gray-200 hover:bg-gray-100'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={visibleDistricts.includes(district)}
                    onChange={() => handleDistrictToggle(district)}
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{district}</span>
                </label>
              ))}
            </div>

            {visibleDistricts.length === 0 && (
              <p className="text-xs text-red-600 mt-2">Please select at least one district</p>
            )}
          </div>

          {/* Image Upload with Camera Support */}
          <div>
            <label className={styles.label}>📸 Product Image</label>

            {preview ? (
              /* ── Image Preview ── */
              <div className="border-2 border-emerald-300 rounded-lg p-4 bg-emerald-50">
                <div className="relative inline-block w-full">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-56 object-contain rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-colors"
                    title="Remove image"
                  >
                    <FiX size={16} />
                  </button>
                </div>
                {formData.image && (
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
                    <span className="truncate mr-2">📄 {formData.image.name}</span>
                    <span className="text-emerald-600 font-medium whitespace-nowrap">
                      {formatFileSize(formData.image.size)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* ── Upload / Camera Buttons ── */
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-emerald-400 transition-colors bg-gray-50">
                <FiUpload className="mx-auto text-4xl text-gray-400 mb-3" />
                <p className="text-gray-500 mb-4">
                  Upload from device or capture with camera
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* Upload from device */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <FiUpload size={16} />
                    Upload Image
                  </button>

                  {/* Capture from camera */}
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                  >
                    <FiCamera size={16} />
                    Take Photo
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  JPG, PNG, GIF, WebP — max 2 MB
                </p>
              </div>
            )}

            {/* Error Message */}
            {imageError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                ⚠️ {imageError}
              </p>
            )}

            {/* Hidden file input for gallery/file upload */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Camera Capture Modal */}
            <CameraCapture
              isOpen={isCameraOpen}
              onClose={() => setIsCameraOpen(false)}
              onCapture={handleCameraCapture}
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Adding Product...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Add Product
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}