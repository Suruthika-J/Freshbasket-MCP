// backend/services/grokService.js
// ============================================================
// SHARED AI SERVICE (Grok / Groq auto-detect)
// Single API key, role-based system prompts
// ============================================================

// ── API Configuration ───────────────────────────────────────
// Auto-detect provider based on API key prefix:
//   gsk_* → Groq  (https://api.groq.com)
//   xai-* → Grok  (https://api.x.ai)
// ─────────────────────────────────────────────────────────────

const PROVIDERS = {
    groq: {
        name: 'Groq',
        apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
        defaultModel: 'llama-3.3-70b-versatile',
    },
    grok: {
        name: 'Grok (xAI)',
        apiUrl: 'https://api.x.ai/v1/chat/completions',
        defaultModel: 'grok-3-mini-fast',
    },
};

// ── API Key Management ──────────────────────────────────────
let apiKey = null;
let provider = null;
let initError = null;

/**
 * Detect which provider to use based on the API key prefix
 */
const detectProvider = (key) => {
    if (!key) return null;
    if (key.startsWith('gsk_')) return 'groq';
    if (key.startsWith('xai-')) return 'grok';
    // Default: try Groq if uncertain (most common free tier)
    return 'groq';
};

export const initializeGrok = () => {
    try {
        apiKey = process.env.GROK_API_KEY;

        if (!apiKey) {
            initError = 'GROK_API_KEY not found in environment variables';
            console.error('❌ AI SERVICE:', initError);
            console.error('💡 Add GROK_API_KEY=your_key_here to your .env file');
            return false;
        }

        if (apiKey.length < 20) {
            initError = 'GROK_API_KEY appears to be invalid (too short)';
            console.error('❌ AI SERVICE:', initError);
            return false;
        }

        // Auto-detect provider
        const detectedProvider = detectProvider(apiKey);
        provider = PROVIDERS[detectedProvider];

        if (!provider) {
            initError = 'Could not detect AI provider from API key';
            console.error('❌ AI SERVICE:', initError);
            return false;
        }

        initError = null;
        console.log(`✅ AI Service initialized → ${provider.name}`);
        console.log(`🔑 API Key: ${apiKey.substring(0, 10)}...`);
        console.log(`🌐 Endpoint: ${provider.apiUrl}`);
        console.log(`🤖 Model: ${provider.defaultModel}`);
        return true;
    } catch (error) {
        initError = `Failed to initialize AI service: ${error.message}`;
        console.error('❌ AI INIT ERROR:', error);
        return false;
    }
};

export const getServiceStatus = () => ({
    isReady: !!apiKey && !!provider && !initError,
    hasApiKey: !!process.env.GROK_API_KEY,
    provider: provider?.name || 'none',
    error: initError,
});

// ── System Prompts ──────────────────────────────────────────

const SYSTEM_PROMPTS = {
    customer: `You are "FreshBasket Recipe Assistant" — a friendly, knowledgeable AI cooking helper for FreshBasket, an online grocery delivery platform.

YOUR PERSONALITY:
- Warm, encouraging, and enthusiastic about cooking
- Use food-related emojis sparingly but effectively
- Keep language simple and accessible

YOUR CAPABILITIES:
1. **Recipe Suggestions**: When users mention ingredients, suggest 1-2 recipes they can make.
2. **Cooking Steps**: Provide clear, numbered step-by-step instructions.
3. **Cooking Time**: Always mention prep time + cooking time.
4. **Product Recommendations**: Naturally suggest FreshBasket products that complement the recipe (e.g., "You can find fresh basil on FreshBasket!" or "FreshBasket has great organic tomatoes for this recipe.").
5. **Dietary Info**: Mention if a recipe is vegetarian, vegan, gluten-free, etc.

RESPONSE FORMAT:
- Use markdown-style formatting with headers and bullet points
- Keep responses concise (under 400 words)
- Structure: Recipe Name → Ingredients → Steps → Tips
- Always include serving size and approximate time

IMPORTANT:
- If unsure about an ingredient, ask for clarification
- Suggest substitutions when possible
- Focus on practical, home-cooking friendly recipes
- Mention FreshBasket naturally, not forcefully`,

    farmer: `You are "FreshBasket Market Price Assistant" — an AI helper designed for Indian farmers to check daily vegetable and fruit market prices.

YOUR PERSONALITY:
- Simple, clear, and respectful language
- Farmer-friendly — avoid jargon
- Supportive and helpful tone
- You can respond in Tamil OR English based on the language the farmer uses

YOUR CAPABILITIES:
1. **Price Information**: Provide current approximate market prices for vegetables, fruits, and crops.
2. **Multi-language**: Understand queries in Tamil (தமிழ்), English, and mixed Tamil-English (Tanglish).
3. **Crop Name Normalization**: Understand crops in both Tamil and English names:
   - தக்காளி = Tomato
   - வெங்காயம் = Onion
   - உருளைக்கிழங்கு = Potato
   - கத்திரிக்காய் = Brinjal/Eggplant
   - முருங்கைக்காய் = Drumstick
   - பீன்ஸ் = Beans
   - கேரட் = Carrot
   - முட்டைக்கோஸ் = Cabbage
   - காலிஃபிளவர் = Cauliflower
   - பூசணிக்காய் = Pumpkin
   - வெண்டைக்காய் = Lady's Finger/Okra
   - மிளகாய் = Chilli
   - இஞ்சி = Ginger
   - பூண்டு = Garlic
   - மா = Mango
   - வாழைப்பழம் = Banana
   - ஆப்பிள் = Apple
   - திராட்சை = Grapes
   - பப்பாளி = Papaya

RESPONSE FORMAT:
- If the farmer asks in Tamil, respond in Tamil
- If the farmer asks in English, respond in English
- Always include:
  • 🥬 Crop Name (Tamil + English)
  • 💰 Price Range (per kg)
  • 📍 Reference Market (e.g., Koyambedu, Chennai / Oddanchatram / Mettupalayam)
  • 📅 Date: Today's date
  • 📊 Price Trend: Stable / Rising / Falling (approximate)

PRICE DATA NOTE:
- Provide approximate, realistic market prices based on typical Indian market rates.
- State that prices are approximate and may vary by location.
- Use ₹ (Indian Rupee) for all prices.
- Common reference markets: Koyambedu (Chennai), Madurai, Coimbatore, Oddanchatram, Mettupalayam.

IMPORTANT:
- Keep responses short and clear — many farmers use mobile phones
- Use simple formatting (no complex tables)
- If the farmer asks about a crop you don't recognize, ask for clarification
- Mention that for exact prices, farmers can check their local mandi or AGMARKNET website
- Be encouraging and supportive of farmers`,
};

// ── Conversation Memory (per-session) ───────────────────────
const conversationHistory = new Map();

const MAX_HISTORY_LENGTH = 10; // Keep last 10 exchanges
const HISTORY_TTL = 30 * 60 * 1000; // 30 minutes

// Clean up old sessions periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, session] of conversationHistory.entries()) {
        if (now - session.lastAccess > HISTORY_TTL) {
            conversationHistory.delete(key);
        }
    }
}, 5 * 60 * 1000);

// ── Core Chat Function ──────────────────────────────────────

/**
 * Send a chat message to AI API with role-based system prompt
 * @param {string} role - 'customer' or 'farmer'
 * @param {string} message - User's message
 * @param {string} sessionId - Session identifier for conversation context
 * @returns {Promise<{success: boolean, response: string, error?: string}>}
 */
export const chat = async (role, message, sessionId = 'default') => {
    // Pre-flight checks
    if (!apiKey || !provider) {
        return {
            success: false,
            error: 'AI service is not configured. Missing GROK_API_KEY.',
            hint: 'Check if GROK_API_KEY is set in .env file',
        };
    }

    const systemPrompt = SYSTEM_PROMPTS[role];
    if (!systemPrompt) {
        return {
            success: false,
            error: `Invalid role: ${role}. Expected 'customer' or 'farmer'.`,
        };
    }

    // Get or create conversation history for this session
    const historyKey = `${role}:${sessionId}`;
    if (!conversationHistory.has(historyKey)) {
        conversationHistory.set(historyKey, {
            messages: [],
            lastAccess: Date.now(),
        });
    }

    const session = conversationHistory.get(historyKey);
    session.lastAccess = Date.now();

    // Build messages array with conversation context
    const messages = [
        { role: 'system', content: systemPrompt },
        ...session.messages,
        { role: 'user', content: message },
    ];

    try {
        console.log(`🤖 [${role.toUpperCase()}] via ${provider.name}: "${message.substring(0, 80)}..."`);

        // Create timeout promise (30s)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        );

        // Call AI API
        const fetchPromise = fetch(provider.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                messages,
                model: provider.defaultModel,
                max_tokens: role === 'farmer' ? 600 : 1000,
                temperature: role === 'farmer' ? 0.3 : 0.7,
            }),
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || response.statusText;
            console.error(`❌ API ${response.status}: ${errorMsg}`);
            throw new Error(`API error: ${response.status} - ${errorMsg}`);
        }

        const data = await response.json();

        if (!data.choices || !data.choices[0]) {
            throw new Error('Invalid response from AI API — no choices returned');
        }

        const reply = data.choices[0].message.content;

        // Store in conversation history
        session.messages.push(
            { role: 'user', content: message },
            { role: 'assistant', content: reply }
        );

        // Trim history if too long
        if (session.messages.length > MAX_HISTORY_LENGTH * 2) {
            session.messages = session.messages.slice(-MAX_HISTORY_LENGTH * 2);
        }

        console.log(`✅ [${role.toUpperCase()}] Response generated (${reply.length} chars)`);

        return {
            success: true,
            response: reply,
        };
    } catch (error) {
        console.error(`❌ [${role.toUpperCase()}] Error:`, error.message);

        // Classify error for the client
        if (
            error.message?.includes('API key') ||
            error.message?.includes('invalid_api_key') ||
            error.message?.includes('401') ||
            error.message?.includes('Unauthorized')
        ) {
            return {
                success: false,
                error: 'Invalid API key. Please check your AI API key.',
                statusCode: 401,
            };
        }

        if (error.message?.includes('timeout')) {
            return {
                success: false,
                error: 'Request timed out. Please try again.',
                statusCode: 504,
            };
        }

        if (error.message?.includes('quota') || error.message?.includes('429') || error.message?.includes('rate')) {
            return {
                success: false,
                error: 'Rate limit reached. Please wait a moment and try again.',
                statusCode: 429,
            };
        }

        if (error.message?.includes('model') || error.message?.includes('404')) {
            return {
                success: false,
                error: 'AI model not available. Please check configuration.',
                details: error.message,
                statusCode: 400,
            };
        }

        return {
            success: false,
            error: 'Failed to generate response. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            statusCode: 500,
        };
    }
};

// ── Clear Session History ───────────────────────────────────
export const clearSession = (role, sessionId) => {
    const historyKey = `${role}:${sessionId}`;
    conversationHistory.delete(historyKey);
};

// Initialize on import
initializeGrok();

export default { chat, clearSession, initializeGrok, getServiceStatus };
