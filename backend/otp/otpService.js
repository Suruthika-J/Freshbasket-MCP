import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a 6-digit OTP
 * @returns {string} 6-digit OTP
 */
export function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash OTP before storing in database
 * @param {string} otp - Plain OTP
 * @returns {Promise<string>} Hashed OTP
 */
export async function hashOTP(otp) {
    return await bcrypt.hash(otp, 10);
}

/**
 * Verify OTP against hashed version
 * @param {string} plainOtp - User entered OTP
 * @param {string} hashedOtp - Stored hashed OTP
 * @returns {Promise<boolean>} True if match
 */
export async function verifyOTP(plainOtp, hashedOtp) {
    return await bcrypt.compare(plainOtp, hashedOtp);
}