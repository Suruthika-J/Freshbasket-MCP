// backend/services/twilioService.js
import twilio from 'twilio';

// Initialize Twilio client with environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const ownerPhoneNumber = process.env.OWNER_PHONE_NUMBER;

// Log initialization status for debugging
console.log('=== Twilio Service Initialized ===');
console.log('Account SID:', accountSid ? '✅ Loaded' : '❌ Missing');
console.log('Auth Token:', authToken ? '✅ Loaded' : '❌ Missing');
console.log('Twilio Phone:', twilioPhoneNumber || '❌ Missing');
console.log('Owner Phone:', ownerPhoneNumber || '❌ Missing');

// Create Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

if (!client) {
    console.error('⚠️ WARNING: Twilio client not initialized - check .env file');
}

/**
 * Send SMS notification using Twilio
 * @param {string} message - The message to send
 * @param {string} to - Recipient phone number (defaults to owner)
 * @returns {Promise<object>} - Twilio message response
 */
export const sendSMS = async (message, to = ownerPhoneNumber) => {
    try {
        console.log('\n=== Sending SMS ===');
        console.log('To:', to);
        console.log('Message:', message.substring(0, 50) + '...');

        // Validate configuration
        if (!accountSid || !authToken || !twilioPhoneNumber) {
            throw new Error('Twilio credentials not configured in .env file');
        }

        if (!to) {
            throw new Error('Recipient phone number not configured');
        }

        if (!client) {
            throw new Error('Twilio client not initialized');
        }

        // Send SMS via Twilio
        const messageResponse = await client.messages.create({
            body: message,
            from: twilioPhoneNumber,
            to: to,
        });

        console.log('✅ SMS sent successfully!');
        console.log('Message SID:', messageResponse.sid);
        console.log('Status:', messageResponse.status);
        
        return {
            success: true,
            messageSid: messageResponse.sid,
            status: messageResponse.status,
        };
    } catch (error) {
        console.error('❌ Failed to send SMS');
        console.error('Error:', error.message);
        if (error.code) console.error('Error Code:', error.code);
        if (error.moreInfo) console.error('More Info:', error.moreInfo);
        
        return {
            success: false,
            error: error.message,
        };
    }
};

/**
 * Format and send out of stock alert
 * @param {object} product - Product object with name, category, and stock
 */
export const sendOutOfStockAlert = async (product) => {
    console.log(`\n🚨 OUT OF STOCK ALERT for: ${product.name}`);
    
    const message = `🚨 OUT OF STOCK ALERT - RushBasket\n\nProduct: ${product.name}\nCategory: ${product.category}\nCurrent Stock: ${product.stock}\n\nPlease restock immediately!`;
    
    return await sendSMS(message);
};

/**
 * Format and send low stock warning
 * @param {object} product - Product object with name, category, and stock
 */
export const sendLowStockAlert = async (product) => {
    const threshold = process.env.LOW_STOCK_THRESHOLD || 5;
    console.log(`\n⚠️ LOW STOCK ALERT for: ${product.name} (${product.stock} ≤ ${threshold})`);
    
    const message = `⚠️ LOW STOCK WARNING - RushBasket\n\nProduct: ${product.name}\nCategory: ${product.category}\nCurrent Stock: ${product.stock}\nThreshold: ${threshold}\n\nConsider restocking soon.`;
    
    return await sendSMS(message);
};

/**
 * Check stock level and send appropriate alert
 * @param {object} product - Product object
 * @param {number} previousStock - Previous stock quantity
 */
export const checkAndNotifyStockLevel = async (product, previousStock) => {
    const lowStockThreshold = Number(process.env.LOW_STOCK_THRESHOLD) || 5;
    const outOfStockThreshold = Number(process.env.OUT_OF_STOCK_THRESHOLD) || 0;
    
    const currentStock = product.stock;
    
    console.log('\n=== Stock Level Check ===');
    console.log('Product:', product.name);
    console.log('Previous Stock:', previousStock);
    console.log('Current Stock:', currentStock);
    console.log('Low Stock Threshold:', lowStockThreshold);
    console.log('Out of Stock Threshold:', outOfStockThreshold);
    
    // Check if product just went out of stock
    if (currentStock <= outOfStockThreshold && previousStock > outOfStockThreshold) {
        console.log('✉️ Triggering OUT OF STOCK notification...');
        await sendOutOfStockAlert(product);
        return;
    }
    
    // Check if product just entered low stock range
    if (
        currentStock > outOfStockThreshold && 
        currentStock <= lowStockThreshold &&
        previousStock > lowStockThreshold
    ) {
        console.log('✉️ Triggering LOW STOCK notification...');
        await sendLowStockAlert(product);
        return;
    }
    
    console.log('ℹ️ No notification needed (stock level unchanged or increased)');
};

export default {
    sendSMS,
    sendOutOfStockAlert,
    sendLowStockAlert,
    checkAndNotifyStockLevel,
};