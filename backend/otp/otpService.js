// backend/otp/otpService.js
import nodemailer from 'nodemailer';
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

/**
 * Create Nodemailer transporter using Gmail
 * Requires EMAIL_USER and EMAIL_PASS in .env
 */
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail address
            pass: process.env.EMAIL_PASS  // Gmail App Password (NOT regular password)
        }
    });
}

/**
 * Send OTP email for signup verification
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - User's name
 */
export async function sendSignupOTP(email, otp, name) {
    const transporter = createTransporter();
    
    const mailOptions = {
        from: `"RushBasket" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Verify Your RushBasket Account',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 50px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 40px 30px; }
                    .otp-box { background: #f0f4ff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    .btn { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🛒 Welcome to RushBasket!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${name},</h2>
                        <p>Thank you for signing up! Please verify your email address to activate your account.</p>
                        <p>Your One-Time Password (OTP) is:</p>
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                        </div>
                        <p><strong>⏰ This OTP will expire in 5 minutes.</strong></p>
                        <p>If you didn't create this account, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RushBasket. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Signup OTP sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending signup OTP:', error);
        throw new Error('Failed to send OTP email');
    }
}

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {string} name - User's name
 */
export async function sendForgotPasswordOTP(email, otp, name) {
    const transporter = createTransporter();
    
    const mailOptions = {
        from: `"RushBasket Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔒 Reset Your RushBasket Password',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 50px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 40px 30px; }
                    .otp-box { background: #fff5f5; border: 2px dashed #f5576c; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 8px; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
                    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${name},</h2>
                        <p>We received a request to reset your RushBasket password. Use the OTP below to proceed:</p>
                        <div class="otp-box">
                            <div class="otp-code">${otp}</div>
                        </div>
                        <p><strong>⏰ This OTP will expire in 5 minutes.</strong></p>
                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
                        </div>
                    </div>
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} RushBasket. All rights reserved.</p>
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset OTP sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending password reset OTP:', error);
        throw new Error('Failed to send OTP email');
    }
}