// backend/routes/chatbot.js
import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI with better error handling
let genAI = null;
let initError = null;

const initializeAI = () => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      initError = 'GEMINI_API_KEY not found in environment variables';
      console.error('❌ CHATBOT ERROR:', initError);
      console.error('💡 Make sure .env file exists with GEMINI_API_KEY=your_key_here');
      return false;
    }

    if (apiKey.length < 20) {
      initError = 'GEMINI_API_KEY appears to be invalid (too short)';
      console.error('❌ CHATBOT ERROR:', initError);
      return false;
    }

    genAI = new GoogleGenerativeAI(apiKey);
    console.log('✅ Gemini AI initialized successfully');
    console.log('🔑 API Key present:', apiKey.substring(0, 10) + '...');
    return true;
    
  } catch (error) {
    initError = `Failed to initialize Gemini AI: ${error.message}`;
    console.error('❌ CHATBOT INIT ERROR:', error);
    return false;
  }
};

// Initialize on module load
initializeAI();

// Health check endpoint - useful for debugging
router.get('/health', (req, res) => {
  res.json({
    status: genAI ? 'healthy' : 'unhealthy',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    apiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    error: initError,
    timestamp: new Date().toISOString()
  });
});

// POST /api/chatbot/recipe
router.post('/recipe', async (req, res) => {
  console.log('\n📨 ===== NEW CHATBOT REQUEST =====');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  console.log('🔑 Has API Key:', !!process.env.GEMINI_API_KEY);
  console.log('🤖 AI Initialized:', !!genAI);

  try {
    // Check if AI is initialized
    if (initError || !genAI) {
      console.error('❌ AI not initialized:', initError);
      return res.status(503).json({ 
        success: false, 
        error: 'AI service is not available. Please check server configuration.',
        details: initError,
        hint: 'Check if GEMINI_API_KEY is set in .env file'
      });
    }

    const { message } = req.body;

    // Validate message
    if (!message) {
      console.warn('⚠️ No message in request body');
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required',
        received: req.body
      });
    }

    if (typeof message !== 'string') {
      console.warn('⚠️ Message is not a string:', typeof message);
      return res.status(400).json({ 
        success: false, 
        error: 'Message must be a string',
        received: typeof message
      });
    }

    if (message.trim() === '') {
      console.warn('⚠️ Message is empty after trim');
      return res.status(400).json({ 
        success: false, 
        error: 'Message cannot be empty'
      });
    }

    console.log('✅ Validation passed');
    console.log('📝 Processing message:', message.substring(0, 100) + (message.length > 100 ? '...' : ''));

    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      }
    });

    // Create a recipe-focused prompt
    const prompt = `You are a helpful cooking assistant for RushBasket, a grocery delivery service. 
A customer is asking: "${message}"

Please provide a helpful, friendly response. If they're asking about:
- Ingredients: Suggest recipes using those ingredients
- Dishes: Provide a simple recipe with ingredients list and cooking steps
- Cooking questions: Give clear, concise advice

Keep responses well-formatted, friendly, and practical. Include:
- Recipe name (if applicable)
- Ingredients list with quantities
- Step-by-step cooking instructions
- Cooking time and servings

Format your response with clear sections and line breaks.`;

    console.log('🔄 Calling Gemini API...');
    
    // Generate content with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
    );

    const result = await Promise.race([
      model.generateContent(prompt),
      timeoutPromise
    ]);

    const response = result.response;
    const text = response.text();

    console.log('✅ Recipe generated successfully');
    console.log('📏 Response length:', text.length, 'characters');
    console.log('📄 Response preview:', text.substring(0, 150) + '...');

    return res.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('\n❌ ===== CHATBOT ERROR =====');
    console.error('💥 Error name:', error.name);
    console.error('📝 Error message:', error.message);
    console.error('🔍 Error stack:', error.stack);
    console.error('============================\n');

    // Handle specific error types
    if (error.message?.includes('API key') || 
        error.message?.includes('API_KEY_INVALID') ||
        error.message?.includes('invalid_api_key')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key. Please check your Gemini API key configuration.',
        details: error.message,
        hint: 'Verify GEMINI_API_KEY in .env file'
      });
    }

    if (error.message?.includes('timeout')) {
      return res.status(504).json({
        success: false,
        error: 'Request timed out. The AI took too long to respond.',
        hint: 'Try a shorter question or try again'
      });
    }

    if (error.message?.includes('quota') || 
        error.message?.includes('rate limit') ||
        error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({
        success: false,
        error: 'API rate limit reached. Please try again in a few moments.',
        hint: 'Gemini API has usage limits'
      });
    }

    if (error.message?.includes('model not found')) {
      return res.status(400).json({
        success: false,
        error: 'AI model configuration error.',
        details: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Failed to generate recipe. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;