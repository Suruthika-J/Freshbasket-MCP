import dotenv from 'dotenv';
dotenv.config();
import { sendOtpEmail } from './utils/sendOtpEmail.js';

console.log("Testing email to quickcommerceapp@gmail.com with OTP 123456");
sendOtpEmail('quickcommerceapp@gmail.com', '123456');

// wait a bit for setImmediate/promise to resolve
setTimeout(() => {
    console.log("Done waiting");
}, 5000);
