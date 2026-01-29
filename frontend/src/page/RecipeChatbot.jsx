//frontend/src/page/RecipeChatbot.jsx
// frontend/src/page/RecipeChatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const RecipeChatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "👋 Hi! I'm your AI Recipe Assistant from FreshBasket. I can help you with:\n\n🥗 Recipe suggestions based on ingredients\n🍳 Step-by-step cooking instructions\n🛒 Meal planning ideas\n\nWhat would you like to cook today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chatbot/health`, {
        timeout: 5000
      });
      
      console.log('🏥 Health check:', response.data);
      
      if (response.data.status !== 'healthy') {
        console.warn('⚠️ Backend is unhealthy:', response.data);
        setConnectionError(true);
      } else {
        setConnectionError(false);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      setConnectionError(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setConnectionError(false);

    // Add user message
    const newUserMessage = {
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      console.log('📤 Sending message:', userMessage);
      
      const response = await axios.post(
        `${API_BASE_URL}/chatbot/recipe`,
        { message: userMessage },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 35000, // 35 second timeout
        }
      );

      console.log('📥 Response received:', response.data);

      if (response.data.success) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: response.data.response,
          timestamp: new Date()
        }]);
      } else {
        console.error('⚠️ Backend error:', response.data);
        setMessages(prev => [...prev, {
          type: 'bot',
          text: `❌ ${response.data.error || 'Sorry, I encountered an error.'}\n\n${response.data.hint ? '💡 ' + response.data.hint : ''}`,
          timestamp: new Date(),
          isError: true
        }]);
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      
      let errorMessage = '❌ Something went wrong. ';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'The request timed out. The AI is taking too long to respond.';
      } else if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('📡 Error response:', { status, data });
        
        if (status === 503) {
          errorMessage = '🔧 AI service is not available. Please check:\n\n• Backend server is running\n• GEMINI_API_KEY is set in .env\n• API key is valid';
        } else if (status === 401) {
          errorMessage = '🔑 Invalid API key. Please check your Gemini API key configuration.';
        } else if (status === 429) {
          errorMessage = '⏳ Rate limit reached. Please wait a moment and try again.';
        } else if (status === 400) {
          errorMessage = `⚠️ ${data.error || 'Invalid request. Please try rephrasing your question.'}`;
        } else {
          errorMessage += data.error || `Server error (${status})`;
        }
        
        if (data.hint) {
          errorMessage += `\n\n💡 ${data.hint}`;
        }
      } else if (error.request) {
        console.error('📭 No response from server');
        errorMessage = '🔌 Cannot connect to server.\n\nPlease check:\n• Backend is running on http://localhost:4000\n• No firewall blocking the connection';
        setConnectionError(true);
      } else {
        errorMessage += error.message;
      }
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: errorMessage,
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedPrompts = [
    "Recipe with chicken and vegetables",
    "Quick pasta recipe",
    "Healthy breakfast ideas",
    "Vegetarian curry recipe"
  ];

  const handleRetry = () => {
    checkBackendHealth();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900 pt-20">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-gray-900/95 backdrop-blur-xl border-b border-emerald-500/30 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
              <IoSparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">AI Recipe Assistant</h1>
              <p className="text-emerald-400 text-xs">Powered by Gemini AI</p>
            </div>
          </div>
          
          <div className="w-20"></div>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="fixed top-32 left-0 right-0 z-30 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start space-x-3">
              <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-200 text-sm font-medium">Connection Issue</p>
                <p className="text-red-300 text-xs mt-1">
                  Cannot connect to the AI service. Check if the backend is running.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="text-red-300 hover:text-red-100 text-sm font-medium"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-32">
        <div className="space-y-4 mb-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.type === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : msg.isError
                    ? 'bg-red-500/20 border border-red-500/50 text-red-200'
                    : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-gray-100'
                } shadow-lg`}
              >
                <p className="text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                  {msg.text}
                </p>
                <p className={`text-xs mt-2 ${
                  msg.type === 'user' ? 'text-blue-200' : msg.isError ? 'text-red-300' : 'text-emerald-300'
                }`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-2xl px-4 py-3 shadow-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="mb-6">
            <p className="text-gray-400 text-sm mb-3 text-center">Try asking:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="text-left px-4 py-2 bg-gray-800/50 border border-emerald-500/30 rounded-lg text-gray-300 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all text-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-xl border-t border-emerald-500/30 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about recipes, ingredients, or cooking tips..."
                rows="1"
                disabled={isLoading}
                className="w-full px-4 py-3 bg-gray-800 border border-emerald-500/30 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:opacity-50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full text-white shadow-lg hover:shadow-emerald-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
          
          <p className="text-center text-gray-500 text-xs mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecipeChatbot;