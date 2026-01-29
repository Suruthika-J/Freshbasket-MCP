// File: userRoute.js
// Path: backend/routes/userRoute.js

import express from 'express';
import {
  signupWithOtp,
  verifySignupOtp,
  resendSignupOtp,
  loginUser,
  forgotPasswordOtp,
  verifyForgotOtp,
  resetPasswordAfterOtp,
  googleAuthSuccess,
  getUserProfile,
  updateProfile,
  changePassword,
  getUserStats,
  deleteAccount,
  logoutUser,
  getPendingFarmers,
  getApprovedFarmers,
  updateFarmerApproval,
  deactivateFarmer,
  updateFarmerProfile // ADD THIS IMPORT
} from '../controllers/userController.js';
import authMiddleware, { requireAdmin } from '../middleware/auth.js';

const userRouter = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

// Google OAuth Authentication
userRouter.post('/google-auth', googleAuthSuccess);

// OTP-based Signup Flow
userRouter.post('/signup', signupWithOtp);
userRouter.post('/verify-otp', verifySignupOtp);
userRouter.post('/resend-otp', resendSignupOtp);

// Login
userRouter.post('/login', loginUser);

// Forgot Password Flow with OTP
userRouter.post('/forgot-password', forgotPasswordOtp);
userRouter.post('/verify-forgot-otp', verifyForgotOtp);
userRouter.post('/reset-password', resetPasswordAfterOtp);

// ============================================
// PROTECTED ROUTES (Require authentication)
// ============================================

// User Profile Management
userRouter.get('/profile', authMiddleware, getUserProfile);
userRouter.put('/profile', authMiddleware, updateProfile);
userRouter.put('/change-password', authMiddleware, changePassword);
userRouter.get('/stats', authMiddleware, getUserStats);
userRouter.delete('/delete', authMiddleware, deleteAccount);
userRouter.post('/logout', authMiddleware, logoutUser);

// ============================================
// FARMER PROFILE UPDATE (Protected, Farmer-only)
// ============================================
userRouter.put('/farmer/profile', authMiddleware, updateFarmerProfile);

// ============================================
// ADMIN-ONLY ROUTES (Farmer Management)
// ============================================

// Get pending farmers awaiting approval
userRouter.get('/admin/farmers/pending', authMiddleware, requireAdmin, getPendingFarmers);

// Get approved farmers
userRouter.get('/admin/farmers/approved', authMiddleware, requireAdmin, getApprovedFarmers);

// Approve or reject farmer
userRouter.put('/admin/farmers/:farmerId/approve', authMiddleware, requireAdmin, updateFarmerApproval);

// Deactivate farmer
userRouter.put('/admin/farmers/:farmerId/deactivate', authMiddleware, requireAdmin, deactivateFarmer);

export default userRouter;