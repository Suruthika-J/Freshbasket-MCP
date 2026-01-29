// File: AddItem.jsx
// Path: frontend/src/admin/components/AddItem.jsx

import React, { useState, useRef } from "react";
import axios from "axios";
import { FiUpload, FiX, FiSave } from "react-icons/fi";
import { addItemPageStyles as styles } from "../assets/adminStyles";

const initialFormState = {
  name: "",
  description: "",
  category: "",
  oldPrice: "",
  price: "",
  stock: "",
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

export default function AddItemPage() {
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }
    
    setFormData((f) => ({
      ...f,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  };

  const removeImage = () => {
    setFormData((f) => ({ ...f, image: null, preview: "" }));
    fileInputRef.current.value = "";
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
      const token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
      
      const body = new FormData();
      body.append("name", formData.name);
      body.append("description", formData.description);
      body.append("category", formData.category);
      body.append("oldPrice", formData.oldPrice);
      body.append("price", formData.price);
      body.append("stock", formData.stock);
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
      fileInputRef.current.value = "";
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
                  className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                    visibleDistricts.includes(district)
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

          {/* Image Upload */}
          <div>
            <label className={styles.label}>Product Image</label>
            <div
              onClick={() => fileInputRef.current.click()}
              className={styles.imageUploadContainer}
            >
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className={styles.previewImage}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage();
                    }}
                    className={styles.removeButton}
                  >
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <FiUpload className={styles.uploadIcon} />
                  <p className={styles.uploadText}>
                    Click to upload image (max 5 MB)
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className={styles.hiddenInput}
              />
            </div>
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