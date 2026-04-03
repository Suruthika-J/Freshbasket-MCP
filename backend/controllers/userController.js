// File: backend/controllers/userController.js
// Path: backend/controllers/userController.js
// ✅ COMPLETE VERSION - All existing features + Pincode auto-fetch for farmers

import User from "../models/userModel.js";
import DeliveryAgent from "../models/deliveryAgentModel.js";
import Return from "../models/ReturnModel.js";
import Message from "../models/Message.js";
import ParentOrder from "../models/ParentOrderModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import { OAuth2Client } from 'google-auth-library';
import {
    generateOTP,
    hashOTP,
    verifyOTP
} from "../otp/otpService.js";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
const TOKEN_EXPIRES = "24h";
const OTP_EXPIRY_MINUTES = 5;

// Initialize Google OAuth2 Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================
// JWT TOKEN CREATION - UPDATED WITH isApproved
// ============================================
const createToken = (userId, userRole, isApproved = true) =>
    jwt.sign(
        {
            id: userId,
            role: userRole,
            isApproved: isApproved // Include approval status in token
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES }
    );

// ============================================
// ✅ GOOGLE OAUTH AUTHENTICATION
// ============================================
export async function googleAuthSuccess(req, res) {
    try {
        console.log('🔵 Google auth request received');
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        const { credential } = req.body;

        if (!credential) {
            console.log('❌ No credential provided');
            console.log('Available fields:', Object.keys(req.body));
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }

        console.log('🔍 Verifying Google token...');
        console.log('Using GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');

        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (verifyError) {
            console.error('❌ Token verification failed:', verifyError.message);
            return res.status(400).json({
                success: false,
                message: "Invalid Google token",
                error: verifyError.message
            });
        }

        const payload = ticket.getPayload();
        console.log('✅ Token verified. Payload:', {
            email: payload.email,
            name: payload.name,
            sub: payload.sub,
            email_verified: payload.email_verified
        });

        const { email, name, sub: googleId, email_verified } = payload;

        if (!email_verified) {
            console.log('⚠️ Email not verified by Google');
            return res.status(400).json({
                success: false,
                message: "Google email not verified"
            });
        }

        let user = await User.findOne({ email: email.toLowerCase() });
        let isNewUser = false;

        if (user) {
            console.log('📝 Existing user found:', user.email);

            if (!user.googleId) {
                user.googleId = googleId;
                user.isVerified = true;
            }

            user.lastLogin = new Date();
            await user.save();
        } else {
            console.log('➕ Creating new user...');

            const randomPassword = Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8) +
                Math.random().toString(36).slice(-8);

            user = await User.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                googleId: googleId,
                password: await bcrypt.hash(randomPassword, 10),
                isVerified: true,
                isActive: true,
                role: 'user',
                isApproved: true, // Auto-approve Google users
                lastLogin: new Date()
            });

            isNewUser = true;
            console.log('✅ New user created:', user.email);
        }

        const authToken = createToken(user._id, user.role, user.isApproved);

        console.log('🎫 JWT token generated');

        res.status(200).json({
            success: true,
            message: isNewUser ? "Account created successfully!" : "Login successful!",
            token: authToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                location: user.location,
                isVerified: user.isVerified,
                isApproved: user.isApproved,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        });

        console.log('✅ Response sent successfully');
    } catch (error) {
        console.error('❌ Google auth error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: "Authentication failed. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}

// ============================================
// OTP-BASED SIGNUP FLOW - ✅ UPDATED WITH PINCODE SUPPORT
// ============================================
export async function signupWithOtp(req, res) {
    console.log('--- START SIGNUP FLOW ---');
    console.log('📌 CRITICAL LOG: Request received for signup');
    console.log('🔵 Signup request details:', { name: req.body.name, email: req.body.email, role: req.body.role });

    // ✅ UPDATED: Added pincode, city, state, certification, experience parameters
    const { name, email, password, role, district, pincode, city, state, certification, experience } = req.body;

    if (!name || !email || !password) {
        console.log('❌ Missing required fields');
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters."
        });
    }

    const validRoles = ['user', 'farmer'];
    const userRole = role && validRoles.includes(role) ? role : 'user';

    // ============================================
    // ✅ UPDATED: Farmer validation now requires pincode
    // ============================================
    if (userRole === 'farmer') {
        if (!pincode) {
            return res.status(400).json({
                success: false,
                message: "Pincode is required for farmer registration."
            });
        }

        if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
            return res.status(400).json({
                success: false,
                message: "Pincode must be a valid 6-digit number."
            });
        }

        if (!district) {
            return res.status(400).json({
                success: false,
                message: "District is required for farmer registration."
            });
        }
    }

    try {
        console.log('🔍 Checking for existing user...');
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        if (existingUser) {
            if (!existingUser.isVerified) {
                const otp = generateOTP();
                const hashedOtp = await hashOTP(otp);

                existingUser.otp = hashedOtp;
                existingUser.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
                existingUser.otpPurpose = 'signup';
                await existingUser.save();
                
                console.log('📌 CRITICAL LOG: User saved (existing/unverified updated)');

                // 🔥 Send Response BEFORE sending email 🔥
                res.status(200).json({
                    success: true,
                    message: "Account exists but not verified. New OTP sent to your email.",
                    email: existingUser.email,
                    requiresVerification: true
                });
                console.log('📌 CRITICAL LOG: Response sent (for existing user)');

                // 🔥 Trigger email non-blocking 🔥
                sendOtpEmail(existingUser.email, otp);
                console.log('📌 CRITICAL LOG: Email triggered asynchronously');
                
                return; // End execution
            }

            return res.status(409).json({
                success: false,
                message: "User already exists and is verified. Please login."
            });
        }

        // --- NEW USER CREATION FLOW ---
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('📌 CRITICAL LOG: Password hashed');
        
        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);

        const userData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            isVerified: false,
            role: userRole,
            isApproved: userRole === 'user', // Auto-approve customers, not farmers
            otp: hashedOtp,
            otpExpiry: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
            otpPurpose: 'signup'
        };

        // ============================================
        // ✅ UPDATED: Add farmer location data with pincode
        // ============================================
        if (userRole === 'farmer') {
            userData.district = district.trim();
            userData.location = {
                city: city ? city.trim() : '-',
                state: state ? state.trim() : 'Tamil Nadu',
                country: 'IN'
            };
            if (pincode) {
                userData.pincode = pincode.trim();
            }
            if (certification) {
                userData.certification = certification;
            }
            if (experience !== undefined) {
                userData.experience = Number(experience);
            }

            console.log('🌾 Creating farmer with location & prof details:', {
                district: userData.district,
                city: userData.location.city,
                state: userData.location.state,
                pincode: pincode,
                certification: userData.certification,
                experience: userData.experience
            });
        }

        const user = await User.create(userData);
        console.log('📌 CRITICAL LOG: User saved (new user creation complete)');

        // 🔥 Send Response BEFORE sending email 🔥
        res.status(201).json({
            success: true,
            message: userRole === 'farmer'
                ? "Farmer account created! Please check your email for OTP verification. Your account will require admin approval before you can login."
                : "Account created! Please check your email for OTP verification.",
            email: user.email,
            requiresVerification: true,
            role: userRole
        });
        console.log('📌 CRITICAL LOG: Response sent (for new user)');

        // 🔥 Trigger email non-blocking 🔥
        sendOtpEmail(user.email, otp);
        console.log('📌 CRITICAL LOG: Email triggered asynchronously');
        console.log('--- END SIGNUP FLOW ---');

    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
}

export async function verifySignupOtp(req, res) {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required."
        });
    }

    try {
        const user = await User.findOne({
            email: email.toLowerCase(),
            otpPurpose: 'signup'
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found or invalid request."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Account already verified. Please login."
            });
        }

        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        const isValid = await verifyOTP(otp, user.otp);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again."
            });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        user.otpPurpose = null;
        await user.save();

        const token = createToken(user._id, user.role, user.isApproved);

        res.status(200).json({
            success: true,
            message: "Email verified successfully! You can now login.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                isApproved: user.isApproved
            }
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
}

export async function resendSignupOtp(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required."
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Account already verified. Please login."
            });
        }

        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);

        user.otp = hashedOtp;
        user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        user.otpPurpose = 'signup';
        await user.save();

        // Non-blocking: respond immediately, send email in background
        console.log(`📧 [Resend OTP] Queuing signup OTP email to: ${user.email}`);
        sendOtpEmail(user.email, otp);

        res.status(200).json({
            success: true,
            message: "New OTP sent to your email."
        });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
}

// ============================================
// FORGOT PASSWORD WITH OTP FLOW
// ============================================

export async function forgotPasswordOtp(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email is required."
        });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format."
        });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If this email is registered, you will receive a password reset OTP."
            });
        }

        if (!user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Please verify your account first before resetting password."
            });
        }

        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);

        user.otp = hashedOtp;
        user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
        user.otpPurpose = 'forgot-password';
        await user.save();

        // Non-blocking: respond immediately, send email in background
        console.log(`📧 [Forgot Password] Queuing reset OTP email to: ${user.email}`);
        sendOtpEmail(user.email, otp);

        res.status(200).json({
            success: true,
            message: "Password reset OTP sent to your email.",
            email: user.email
        });
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
}

export async function verifyForgotOtp(req, res) {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required."
        });
    }

    try {
        const user = await User.findOne({
            email: email.toLowerCase(),
            otpPurpose: 'forgot-password'
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid request or user not found."
            });
        }

        if (!user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one."
            });
        }

        const isValid = await verifyOTP(otp, user.otp);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again."
            });
        }

        const resetToken = jwt.sign(
            { id: user._id, purpose: 'password-reset' },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.status(200).json({
            success: true,
            message: "OTP verified! You can now reset your password.",
            resetToken,
            email: user.email
        });
    } catch (err) {
        console.error('Verify forgot OTP error:', err);
        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
}

export async function resetPasswordAfterOtp(req, res) {
    const { resetToken, newPassword } = req.body;

    console.log('🔵 Password reset attempt');

    if (!resetToken || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Reset token and new password are required."
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters."
        });
    }

    try {
        console.log('🔍 Verifying reset token...');
        const decoded = jwt.verify(resetToken, JWT_SECRET);

        if (decoded.purpose !== 'password-reset') {
            console.log('❌ Invalid token purpose');
            return res.status(400).json({
                success: false,
                message: "Invalid reset token."
            });
        }

        console.log('✅ Token verified, finding user...');
        const user = await User.findById(decoded.id);

        if (!user) {
            console.log('❌ User not found');
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        console.log('🔐 Hashing new password...');
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        console.log('✅ Password hashed, saving user...');

        user.password = hashedPassword;
        user.otp = null;
        user.otpExpiry = null;
        user.otpPurpose = null;
        await user.save();

        console.log('✅ Password reset successful for user:', user.email);

        res.status(200).json({
            success: true,
            message: "Password reset successfully! You can now login with your new password."
        });
    } catch (err) {
        console.error('Reset password error:', err);

        if (err.name === 'TokenExpiredError') {
            return res.status(400).json({
                success: false,
                message: "Reset token has expired. Please request a new OTP."
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error. Please try again."
        });
    }
}

// ============================================
// ✅ UNIFIED LOGIN - ENHANCED LOGGING FOR DEBUGGING
// ============================================

export async function loginUser(req, res) {
    const { email, password } = req.body;

    console.log('🔵 ==========================================');
    console.log('🔵 LOGIN ATTEMPT STARTED');
    console.log('🔵 Email:', email);
    console.log('🔵 Password length:', password?.length);
    console.log('🔵 ==========================================');

    if (!email || !password) {
        console.log('❌ Missing email or password');
        return res.status(400).json({
            success: false,
            message: "Email and password required."
        });
    }

    try {
        // Step 1: Try to find user in User collection first
        console.log('🔍 STEP 1: Searching for user in User collection...');
        console.log('🔍 Search email:', email.toLowerCase());

        let user = await User.findOne({ email: email.toLowerCase() });
        let isAgent = false;

        console.log('✅ STEP 1 RESULT:', user ? 'User found' : 'User not found');

        // Step 2: If not found in User, check DeliveryAgent collection
        if (!user) {
            console.log('🔍 STEP 2: Searching in DeliveryAgent collection...');
            user = await DeliveryAgent.findOne({ email: email.toLowerCase() });
            if (user) {
                isAgent = true;
                console.log('✅ STEP 2 RESULT: User found in DeliveryAgent collection');
            } else {
                console.log('❌ STEP 2 RESULT: User not found in DeliveryAgent collection');
            }
        }

        // Step 3: No user found in either collection
        if (!user) {
            console.log('❌ STEP 3: No user found in database');
            console.log('❌ LOGIN FAILED - Invalid credentials');
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        console.log('✅ USER FOUND - Details:');
        console.log('  - ID:', user._id);
        console.log('  - Email:', user.email);
        console.log('  - Role:', user.role);
        console.log('  - isActive:', user.isActive);
        console.log('  - isVerified:', user.isVerified);
        console.log('  - isApproved:', user.isApproved);
        console.log('  - isAgent:', isAgent);
        console.log('  - hasPassword:', !!user.password);

        // Step 4: Check if account is active
        if (!user.isActive) {
            console.log('❌ STEP 4: Account deactivated');
            return res.status(401).json({
                success: false,
                message: "Account is deactivated. Please contact support."
            });
        }
        console.log('✅ STEP 4: Account is active');

        // Step 5: Check verification (for regular users and farmers, not agents/admins)
        if (!isAgent && (user.role === 'user' || user.role === 'farmer') && !user.isVerified) {
            console.log('❌ STEP 5: Email not verified');
            return res.status(403).json({
                success: false,
                message: "Please verify your email before logging in.",
                requiresVerification: true,
                email: user.email
            });
        }
        console.log('✅ STEP 5: Email verification check passed');

        console.log('🔐 STEP 6: Verifying password...');
        console.log('🔐 Password from request length:', password.length);
        console.log('🔐 Stored hash exists:', !!user.password);

        // Step 6: Verify password
        const match = await bcrypt.compare(password, user.password);
        console.log('🔐 Password match result:', match);

        if (!match) {
            console.log('❌ STEP 6: Password does not match');
            console.log('❌ LOGIN FAILED - Invalid credentials');
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        console.log('✅ STEP 6: Password verified successfully');

        // ============================================
        // STEP 7: LOGIN TYPE ROLE VALIDATION
        // Enforce which roles are allowed per login page.
        // This is the backend security gate — frontend UI alone is not enough.
        // ============================================
        const { loginType } = req.body;
        const effectiveRole = isAgent ? 'agent' : (user.role || 'user');

        console.log('🔐 STEP 7: Validating loginType...');
        console.log('  - loginType received:', loginType);
        console.log('  - effectiveRole:', effectiveRole);

        if (loginType) {
            // Define which roles each login page permits
            const allowedRoles = {
                customer: ['user', 'agent'],  // Customer page: customers + delivery agents
                farmer: ['farmer'],          // Farmer page: farmers only
                admin: ['admin'],           // Admin/Retailer page: admins only
            };

            const permitted = allowedRoles[loginType];

            if (!permitted) {
                console.log('❌ STEP 7: Unknown loginType:', loginType);
                return res.status(400).json({
                    success: false,
                    message: "Invalid login type specified."
                });
            }

            if (!permitted.includes(effectiveRole)) {
                console.log(`❌ STEP 7: Role "${effectiveRole}" not allowed on "${loginType}" login page`);

                let deniedMessage = "Access denied: You are not allowed to login from this page.";
                if (loginType === 'customer' && effectiveRole === 'farmer') {
                    deniedMessage = "Farmer accounts must log in from the Farmer Login page.";
                } else if (loginType === 'customer' && effectiveRole === 'admin') {
                    deniedMessage = "Admin accounts must log in from the Retailer Login page.";
                } else if (loginType === 'farmer' && effectiveRole !== 'farmer') {
                    deniedMessage = "This login page is for Farmers only.";
                } else if (loginType === 'admin' && effectiveRole !== 'admin') {
                    deniedMessage = "This login page is for Retailers (Admins) only.";
                }

                return res.status(403).json({
                    success: false,
                    message: deniedMessage,
                    accessDenied: true
                });
            }
            console.log(`✅ STEP 7: Role "${effectiveRole}" permitted on "${loginType}" login page`);
        } else {
            console.log('⚠️  STEP 7: No loginType provided — skipping page-level role restriction');
        }

        // Step 8: Check farmer approval AFTER password verification
        if (!isAgent && user.role === 'farmer') {
            console.log('🌾 STEP 8: Checking farmer approval status...');

            // Re-fetch user from DB to get latest approval status
            const freshUser = await User.findById(user._id);
            console.log('🌾 Fresh farmer data:');
            console.log('  - isApproved:', freshUser.isApproved);
            console.log('  - role:', freshUser.role);

            if (!freshUser.isApproved) {
                console.log('❌ STEP 8: Farmer not approved');
                console.log('❌ LOGIN FAILED - Pending approval');
                return res.status(403).json({
                    success: false,
                    message: "Your farmer account is pending admin approval. Please wait for approval before logging in.",
                    requiresApproval: true,
                    email: freshUser.email
                });
            }

            console.log('✅ STEP 8: Farmer is approved');

            // Update user reference to fresh data
            user = freshUser;
        } else {
            console.log('✅ STEP 8: Not a farmer or approval check not required');
        }

        console.log('🔄 STEP 9: Updating last login timestamp...');

        // Step 9: Update last login
        user.lastLogin = new Date();
        await user.save();

        console.log('✅ STEP 9: Last login updated');

        // Step 10: Determine role
        const userRole = isAgent ? 'agent' : (user.role || 'user');

        console.log('✅ STEP 10: Role determined:', userRole);

        // Step 11: Generate token with isApproved flag
        console.log('🎫 STEP 11: Generating JWT token...');
        const token = createToken(user._id, userRole, user.isApproved);

        console.log('✅ STEP 11: Token generated successfully');

        // Step 12: Send response with isApproved flag
        const responseData = {
            success: true,
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: userRole,
                phone: user.phone,
                address: user.address,
                location: user.location,
                district: user.district,
                isVerified: user.isVerified,
                isApproved: user.isApproved,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin
            }
        };

        console.log('📤 STEP 12: Sending success response');
        console.log('✅ ==========================================');
        console.log('✅ LOGIN SUCCESSFUL');
        console.log('✅ Email:', email);
        console.log('✅ Role:', userRole);
        console.log('✅ Approved:', user.isApproved);
        console.log('✅ ==========================================');

        res.json(responseData);

    } catch (err) {
        console.error('❌ ==========================================');
        console.error('❌ LOGIN ERROR');
        console.error('❌ Error:', err.message);
        console.error('❌ Stack:', err.stack);
        console.error('❌ ==========================================');

        res.status(500).json({
            success: false,
            message: "Server error during login. Please try again."
        });
    }
}

// ============================================
// PROTECTED ROUTES
// ============================================

export async function getUserProfile(req, res) {
    try {
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function updateProfile(req, res) {
    try {
        const { name, email, phone, address } = req.body;
        const userId = req.user._id;

        if (!name && !email && !phone && !address) {
            return res.status(400).json({
                success: false,
                message: 'At least one field is required to update'
            });
        }

        const updateData = {};

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Name cannot be empty'
                });
            }
            updateData.name = name.trim();
        }

        if (email !== undefined) {
            if (!email.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Email cannot be empty'
                });
            }

            if (!validator.isEmail(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email format'
                });
            }

            const existingUser = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: userId }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already registered with another account'
                });
            }

            updateData.email = email.toLowerCase().trim();
        }

        if (phone !== undefined) {
          if (phone.trim()) {
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length !== 10) {
              return res.status(400).json({
                success: false,
                message: 'Phone number must be 10 digits'
              });
            }
            updateData.phone = cleanPhone;
          } else {
            updateData.phone = '';
          }
        }

        if (address !== undefined) {
          updateData.address = address.trim();
        }

        updateData.profileUpdatedAt = new Date();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages[0]
            });
        }

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email is already registered'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function changePassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function getUserStats(req, res) {
    try {
        const userId = req.user._id;

        // Fetch real order statistics from ParentOrder collection
        const totalOrders = await ParentOrder.countDocuments({ user: userId });
        const completedOrders = await ParentOrder.countDocuments({
            user: userId,
            orderStatus: 'completed'
        });

        const lastOrder = await ParentOrder.findOne({ user: userId })
            .sort({ date: -1 })
            .select('date');

        const stats = {
            totalOrders,
            completedOrders,
            lastOrderDate: lastOrder ? lastOrder.date : null,
            accountCreated: req.user.createdAt,
            lastProfileUpdate: req.user.profileUpdatedAt || req.user.updatedAt
        };

        res.status(200).json({
            success: true,
            totalOrders: stats.totalOrders,
            completedOrders: stats.completedOrders,
            lastOrderDate: stats.lastOrderDate,
            data: stats
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function deleteAccount(req, res) {
    try {
        const { password } = req.body;
        const userId = req.user._id;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required to delete account'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }

        user.isActive = false;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Account deactivated successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function logoutUser(req, res) {
    try {
        res.clearCookie('token');

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

// ============================================
// ADMIN-ONLY: FARMER MANAGEMENT
// ============================================

// ============================================
// ADMIN: GET SUMMARY COUNTS
// ============================================
export async function getAdminSummary(req, res) {
    try {
        const pendingFarmersCount = await User.countDocuments({ role: 'farmer', isApproved: false });
        const pendingReturnsCount = await Return.countDocuments({ status: 'requested' });
        const unreadMessagesCount = await Message.countDocuments({ senderRole: 'farmer', seen: false });

        res.status(200).json({
            success: true,
            summary: {
                pendingFarmers: pendingFarmersCount,
                pendingReturns: pendingReturnsCount,
                unreadMessages: unreadMessagesCount
            }
        });
    } catch (error) {
        console.error('❌ Get admin summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

// ============================================
// ADMIN: FARMER MANAGEMENT
// ============================================
export async function getPendingFarmers(req, res) {
    try {
        const pendingFarmers = await User.find({
            role: 'farmer',
            isApproved: false,
            isActive: true
        }).select('name email phone district location createdAt');

        res.status(200).json({
            success: true,
            data: pendingFarmers,
            count: pendingFarmers.length
        });
    } catch (error) {
        console.error('Get pending farmers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function getApprovedFarmers(req, res) {
    try {
        const approvedFarmers = await User.find({
            role: 'farmer',
            isApproved: true,
            isActive: true
        }).select('name email phone district location createdAt lastLogin');

        res.status(200).json({
            success: true,
            data: approvedFarmers,
            count: approvedFarmers.length
        });
    } catch (error) {
        console.error('Get approved farmers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function updateFarmerApproval(req, res) {
    try {
        const { farmerId } = req.params;
        const { action } = req.body;

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid action. Must be "approve" or "reject"'
            });
        }

        const farmer = await User.findById(farmerId);

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }

        if (farmer.role !== 'farmer') {
            return res.status(400).json({
                success: false,
                message: 'User is not a farmer'
            });
        }

        if (action === 'approve') {
            farmer.isApproved = true;
            await farmer.save();

            console.log('✅ Farmer approved:', {
                id: farmer._id,
                email: farmer.email,
                isApproved: farmer.isApproved
            });

            res.status(200).json({
                success: true,
                message: 'Farmer approved successfully',
                data: {
                    id: farmer._id,
                    name: farmer.name,
                    email: farmer.email,
                    isApproved: farmer.isApproved
                }
            });
        } else if (action === 'reject') {
            farmer.isActive = false;
            await farmer.save();

            console.log('❌ Farmer rejected:', {
                id: farmer._id,
                email: farmer.email,
                isActive: farmer.isActive
            });

            res.status(200).json({
                success: true,
                message: 'Farmer rejected and account deactivated',
                data: {
                    id: farmer._id,
                    name: farmer.name,
                    email: farmer.email,
                    isActive: farmer.isActive
                }
            });
        }
    } catch (error) {
        console.error('Update farmer approval error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

export async function deactivateFarmer(req, res) {
    try {
        const { farmerId } = req.params;

        const farmer = await User.findById(farmerId);

        if (!farmer) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found'
            });
        }

        if (farmer.role !== 'farmer') {
            return res.status(400).json({
                success: false,
                message: 'User is not a farmer'
            });
        }

        if (!farmer.isApproved) {
            return res.status(400).json({
                success: false,
                message: 'Farmer is not approved yet'
            });
        }

        farmer.isActive = false;
        await farmer.save();

        console.log('🚫 Farmer deactivated:', {
            id: farmer._id,
            email: farmer.email,
            isActive: farmer.isActive
        });

        res.status(200).json({
            success: true,
            message: 'Farmer deactivated successfully',
            data: {
                id: farmer._id,
                name: farmer.name,
                email: farmer.email,
                isActive: farmer.isActive
            }
        });
    } catch (error) {
        console.error('Deactivate farmer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}

// ============================================
// UPDATE FARMER PROFILE (certification, experience, district)
// ============================================
export async function updateFarmerProfile(req, res) {
    try {
        const userId = req.user._id;
        const { certification, experience, district } = req.body;

        console.log('🌾 Updating farmer profile:', {
            userId,
            certification,
            experience,
            district
        });

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role !== 'farmer') {
            return res.status(403).json({
                success: false,
                message: 'Only farmers can update farmer profile'
            });
        }

        const validCertifications = ['Organic', 'FSSAI', 'None'];
        if (certification && !validCertifications.includes(certification)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid certification. Must be Organic, FSSAI, or None'
            });
        }

        if (experience !== undefined && (isNaN(experience) || experience < 0)) {
            return res.status(400).json({
                success: false,
                message: 'Experience must be a positive number'
            });
        }

        if (certification) user.certification = certification;
        if (experience !== undefined) user.experience = Number(experience);
        if (district) user.district = district.trim();

        user.profileUpdatedAt = new Date();
        await user.save();

        console.log('✅ Farmer profile updated successfully');

        res.status(200).json({
            success: true,
            message: 'Farmer profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                certification: user.certification,
                experience: user.experience,
                district: user.district,
                isApproved: user.isApproved
            }
        });
    } catch (error) {
        console.error('❌ Update farmer profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
}