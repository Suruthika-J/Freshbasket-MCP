// frontend/src/page/RecipeChatbot.jsx
// ============================================================
// CUSTOMER AI RECIPE CHATBOT
// Text-based chatbot for recipe suggestions using Grok AI
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiArrowLeft, FiAlertCircle, FiTrash2 } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const RecipeChatbot = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: "👋 Hi! I'm your **AI Recipe Assistant** from FreshBasket!\n\nI can help you with:\n\n🥗 **Recipe suggestions** based on your ingredients\n🍳 **Step-by-step** cooking instructions\n⏱️ **Cooking time** and serving info\n🛒 **FreshBasket product** recommendations\n\nWhat would you like to cook today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { checkHealth(); }, []);

  const checkHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/chat/health`, { timeout: 5000 });
      setConnectionError(response.data.status !== 'healthy');
    } catch {
      setConnectionError(true);
    }
  };

  // Format markdown-like text to JSX
  const formatMessage = (text) => {
    return text
      .split('\n')
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: line }} />
            {i < text.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setConnectionError(false);

    setMessages(prev => [...prev, {
      type: 'user',
      text: userMessage,
      timestamp: new Date()
    }]);
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/chat/customer`,
        { message: userMessage },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 35000,
        }
      );

      if (response.data.success) {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: response.data.response,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, {
          type: 'bot',
          text: `❌ ${response.data.error || 'Sorry, something went wrong.'}`,
          timestamp: new Date(),
          isError: true
        }]);
      }
    } catch (error) {
      let errorMessage = '❌ Something went wrong. ';

      if (error.code === 'ECONNABORTED') {
        errorMessage += 'The request timed out.';
      } else if (error.response) {
        const { status, data } = error.response;
        if (status === 503) {
          errorMessage = '🔧 AI service is unavailable. Please check the backend configuration.';
        } else if (status === 401) {
          errorMessage = '🔑 Invalid API key. Please check server configuration.';
        } else if (status === 429) {
          errorMessage = '⏳ Rate limit reached. Please wait and try again.';
        } else {
          errorMessage += data.error || `Server error (${status})`;
        }
      } else if (error.request) {
        errorMessage = '🔌 Cannot connect to server. Is the backend running?';
        setConnectionError(true);
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

  const handleClearChat = async () => {
    try {
      await axios.post(`${API_BASE_URL}/chat/clear`, { role: 'customer' });
    } catch { } // Silent fail
    setMessages([{
      type: 'bot',
      text: "🔄 Chat cleared! What would you like to cook today?",
      timestamp: new Date()
    }]);
  };

  const suggestedPrompts = [
    "🍅 Recipe with tomato, onion, potato",
    "🍝 Quick 15-minute pasta recipe",
    "🥗 Healthy South Indian breakfast ideas",
    "🍛 Vegetarian curry with paneer"
  ];

  return (
    <div className="recipe-chatbot-page">
      {/* Header */}
      <div className="chatbot-header">
        <div className="chatbot-header-inner">
          <button onClick={() => navigate(-1)} className="chatbot-back-btn" aria-label="Go back">
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="chatbot-title-group">
            <div className="chatbot-avatar customer-avatar">
              <IoSparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="chatbot-title">AI Recipe Assistant</h1>
              <p className="chatbot-subtitle">Powered by Grok AI • Customer</p>
            </div>
          </div>

          <button onClick={handleClearChat} className="chatbot-clear-btn" title="Clear chat">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Error Banner */}
      {connectionError && (
        <div className="chatbot-error-banner">
          <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Connection Issue</p>
            <p className="text-xs mt-1">Cannot connect to the AI service.</p>
          </div>
          <button onClick={checkHealth} className="font-bold text-sm hover:underline">Retry</button>
        </div>
      )}

      {/* Messages Container */}
      <div className="chatbot-messages-container">
        <div className="chatbot-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`chatbot-message-row ${msg.type === 'user' ? 'user-row' : 'bot-row'}`}
            >
              <div
                className={`chatbot-bubble ${msg.type === 'user'
                    ? 'user-bubble'
                    : msg.isError
                      ? 'error-bubble'
                      : 'bot-bubble'
                  }`}
              >
                <div className="bubble-text">
                  {msg.type === 'bot' ? formatMessage(msg.text) : msg.text}
                </div>
                <p className="bubble-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chatbot-message-row bot-row">
              <div className="chatbot-bubble bot-bubble">
                <div className="typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts */}
        {messages.length === 1 && (
          <div className="suggested-prompts">
            <p className="suggested-label">Try asking:</p>
            <div className="suggested-grid">
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt.replace(/^[^\s]+\s/, ''))}
                  className="suggested-btn"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="chatbot-input-area">
        <div className="chatbot-input-inner">
          <div className="input-wrapper">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about recipes, ingredients, cooking tips..."
              rows="1"
              disabled={isLoading}
              className="chatbot-textarea"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="chatbot-send-btn"
            aria-label="Send message"
          >
            <FiSend className="w-5 h-5" />
          </button>
        </div>
        <p className="input-hint">Press Enter to send • Shift+Enter for new line</p>
      </div>

      <style>{`
        .recipe-chatbot-page {
          min-height: 100vh;
          background: var(--color-bg);
          display: flex;
          flex-direction: column;
        }

        /* ── Header ────────────────────────────────── */
        .chatbot-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: var(--color-navbar-bg);
          backdrop-filter: blur(16px);
          border-bottom: 1.5px solid var(--color-border);
          box-shadow: var(--shadow-navbar);
        }

        .chatbot-header-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chatbot-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 10px;
          border-radius: 8px;
          transition: var(--transition);
        }

        .chatbot-back-btn:hover {
          color: var(--color-primary);
          background: var(--color-primary-subtle);
        }

        .chatbot-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chatbot-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .customer-avatar {
          background: linear-gradient(135deg, #2E7D32, #66BB6A);
          color: white;
          box-shadow: 0 2px 12px rgba(46, 125, 50, 0.3);
        }

        .chatbot-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
          line-height: 1.2;
        }

        .chatbot-subtitle {
          font-size: 12px;
          color: var(--color-primary);
          font-weight: 600;
          margin: 2px 0 0;
        }

        .chatbot-clear-btn {
          background: none;
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: var(--transition);
        }

        .chatbot-clear-btn:hover {
          color: var(--color-error);
          border-color: var(--color-error);
          background: #FFEBEE;
        }

        /* ── Error Banner ──────────────────────────── */
        .chatbot-error-banner {
          position: fixed;
          top: 75px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 45;
          width: calc(100% - 32px);
          max-width: 900px;
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: #FFF3E0;
          color: #E65100;
          border: 1px solid #FFCC80;
          box-shadow: 0 4px 16px rgba(230, 81, 0, 0.15);
        }

        /* ── Messages ──────────────────────────────── */
        .chatbot-messages-container {
          flex: 1;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          padding: 90px 16px 130px;
        }

        .chatbot-messages {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chatbot-message-row {
          display: flex;
          animation: fadeSlideIn 0.3s ease;
        }

        .user-row { justify-content: flex-end; }
        .bot-row { justify-content: flex-start; }

        .chatbot-bubble {
          max-width: 80%;
          padding: 14px 18px;
          border-radius: 20px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
          line-height: 1.6;
        }

        .user-bubble {
          background: linear-gradient(135deg, #2E7D32, #388E3C);
          color: white;
          border-bottom-right-radius: 6px;
        }

        .bot-bubble {
          background: var(--color-surface);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          border-bottom-left-radius: 6px;
        }

        .error-bubble {
          background: #FFF3F3;
          color: #C62828;
          border: 1px solid #FFCDD2;
          border-bottom-left-radius: 6px;
        }

        [data-theme="dark"] .error-bubble {
          background: #2C0A0A;
          border-color: #4A1010;
        }

        .bubble-text {
          font-size: 14.5px;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .bubble-text strong {
          font-weight: 700;
        }

        .bubble-time {
          font-size: 10px;
          opacity: 0.6;
          margin-top: 6px;
          text-align: right;
        }

        /* ── Typing Indicator ──────────────────────── */
        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-primary);
          animation: typingBounce 1.4s infinite ease-in-out;
        }

        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* ── Suggested Prompts ─────────────────────── */
        .suggested-prompts {
          margin-top: 20px;
        }

        .suggested-label {
          text-align: center;
          color: var(--color-text-muted);
          font-size: 13px;
          margin-bottom: 12px;
        }

        .suggested-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
        }

        .suggested-btn {
          text-align: left;
          padding: 12px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          color: var(--color-text-secondary);
          font-size: 13.5px;
          cursor: pointer;
          transition: var(--transition);
        }

        .suggested-btn:hover {
          background: var(--color-primary-subtle);
          border-color: var(--color-primary);
          color: var(--color-primary);
          transform: translateY(-1px);
        }

        /* ── Input Area ────────────────────────────── */
        .chatbot-input-area {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: var(--color-surface);
          border-top: 1px solid var(--color-border);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.06);
        }

        .chatbot-input-inner {
          max-width: 900px;
          margin: 0 auto;
          padding: 14px 16px 6px;
          display: flex;
          align-items: flex-end;
          gap: 10px;
        }

        .input-wrapper {
          flex: 1;
        }

        .chatbot-textarea {
          width: 100%;
          min-height: 46px;
          max-height: 120px;
          padding: 12px 16px;
          border-radius: 24px;
          border: 1.5px solid var(--color-border);
          background: var(--color-input-bg);
          color: var(--color-text);
          font-size: 14.5px;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: var(--transition);
        }

        .chatbot-textarea:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
        }

        .chatbot-textarea::placeholder {
          color: var(--color-text-muted);
        }

        .chatbot-textarea:disabled {
          opacity: 0.5;
        }

        .chatbot-send-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #2E7D32, #388E3C);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: var(--transition);
          box-shadow: 0 2px 10px rgba(46, 125, 50, 0.3);
        }

        .chatbot-send-btn:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(46, 125, 50, 0.4);
        }

        .chatbot-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .chatbot-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .input-hint {
          text-align: center;
          color: var(--color-text-muted);
          font-size: 10px;
          padding: 4px 0 10px;
          margin: 0;
        }

        /* ── Animations ────────────────────────────── */
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Responsive ────────────────────────────── */
        @media (max-width: 640px) {
          .chatbot-bubble { max-width: 88%; }
          .suggested-grid { grid-template-columns: 1fr; }
          .chatbot-title { font-size: 15px; }
        }
      `}</style>
    </div>
  );
};

export default RecipeChatbot;