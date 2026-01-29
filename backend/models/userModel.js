// backend/models/userModel.js
// UPDATED VERSION - Added pincode field for farmer addresses

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters']
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        return !phone || /^\d{10}$/.test(phone.replace(/\D/g, ''));
      },
      message: 'Phone number must be 10 digits'
    }
  },
  location: {
    city: { type: String, default: '-' },
    state: { type: String, default: 'Tamil Nadu' },
    country: { type: String, default: 'IN' }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'agent', 'farmer'],
    default: 'user'
  },
  district: {
    type: String,
    default: null,
    trim: true
  },
  // ============================================
  // NEW: PINCODE FIELD FOR FARMERS
  // ============================================
  pincode: {
    type: String,
    default: null,
    trim: true,
    validate: {
      validator: function(pincode) {
        return !pincode || /^\d{6}$/.test(pincode);
      },
      message: 'Pincode must be 6 digits'
    }
  },
  // ============================================
  // FARMER-SPECIFIC FIELDS
  // ============================================
  certification: {
    type: String,
    enum: ['Organic', 'FSSAI', 'None', null],
    default: null
  },
  experience: {
    type: Number,
    min: 0,
    default: null
  },
  // ============================================
  isApproved: {
    type: Boolean,
    default: function() {
      // Only farmers need approval, everyone else is auto-approved
      return this.role !== 'farmer';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    default: null
  },
  otpExpiry: {
    type: Date,
    default: null
  },
  otpPurpose: {
    type: String,
    enum: ['signup', 'forgot-password', null],
    default: null
  },
  googleId: {
    type: String,
    default: null,
    sparse: true
  },
  lastLogin: {
    type: Date
  },
  profileUpdatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  if (this.password && (this.password.startsWith('$2a$') || this.password.startsWith('$2b$') || this.password.startsWith('$2y$'))) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for full location
userSchema.virtual('fullLocation').get(function() {
  return `${this.location.city}, ${this.location.state}, ${this.location.country}`;
});

// Virtual for full address including pincode
userSchema.virtual('fullAddress').get(function() {
  if (this.pincode && this.district) {
    return `${this.location.city}, ${this.district}, ${this.location.state} - ${this.pincode}`;
  }
  return this.fullLocation;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.otp;
    delete ret.__v;
    return ret;
  }
});

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;