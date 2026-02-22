// frontend/src/page/FarmerChatbot.jsx
// ============================================================
// FARMER AI MARKET PRICE CHATBOT
// Text + Voice input chatbot for market prices (Tamil + English)
// ============================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    FiSend,
    FiArrowLeft,
    FiAlertCircle,
    FiTrash2,
    FiMic,
    FiMicOff,
} from 'react-icons/fi';
import { IoLeaf } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const FarmerChatbot = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            type: 'bot',
            text: "🌾 வணக்கம்! Welcome! I'm your **FreshBasket Market Price Assistant**.\n\nI can help you check today's vegetable and fruit prices.\n\n🗣️ **Voice Input**: Tap the 🎤 mic button and speak in Tamil or English\n⌨️ **Type**: Type your query in the text box\n\nExample questions:\n• \"இன்றைய தக்காளி விலை என்ன?\"\n• \"Today onion price\"\n• \"Carrot rate in Chennai\"",
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connectionError, setConnectionError] = useState(false);

    // Voice states
    const [isListening, setIsListening] = useState(false);
    const [voiceSupported, setVoiceSupported] = useState(false);
    const [voiceError, setVoiceError] = useState('');
    const [detectedLanguage, setDetectedLanguage] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const recognitionRef = useRef(null);

    // ── Initialize Speech Recognition ─────────────────────────
    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            setVoiceSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 3;

            // Support both Tamil and English
            recognition.lang = 'ta-IN'; // Primary: Tamil

            // Listen for language detection through alternatives
            recognition.onresult = (event) => {
                let interim = '';
                let final = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        final += transcript;
                    } else {
                        interim += transcript;
                    }
                }

                setInterimTranscript(interim);

                if (final) {
                    // Detect language from the transcript
                    const isTamil = /[\u0B80-\u0BFF]/.test(final);
                    setDetectedLanguage(isTamil ? 'ta-IN' : 'en-IN');
                    setInput((prev) => (prev ? prev + ' ' + final : final));
                    setInterimTranscript('');
                }
            };

            recognition.onerror = (event) => {
                console.error('🎤 Speech error:', event.error);
                setIsListening(false);
                setInterimTranscript('');

                if (event.error === 'not-allowed') {
                    setVoiceError('Microphone access denied. Please allow microphone permission.');
                } else if (event.error === 'no-speech') {
                    setVoiceError('No speech detected. Please try again.');
                } else if (event.error === 'network') {
                    setVoiceError('Network error. Check your internet connection.');
                } else {
                    setVoiceError(`Voice error: ${event.error}. Try typing instead.`);
                }

                // Auto-clear error after 5 seconds
                setTimeout(() => setVoiceError(''), 5000);
            };

            recognition.onend = () => {
                setIsListening(false);
                setInterimTranscript('');
            };

            recognitionRef.current = recognition;
        } else {
            setVoiceSupported(false);
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch { }
            }
        };
    }, []);

    // ── Toggle Voice Listening ────────────────────────────────
    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            setVoiceError('');
            setInterimTranscript('');

            // Alternate between Tamil and English based on last detection
            recognitionRef.current.lang = detectedLanguage === 'en-IN' ? 'en-IN' : 'ta-IN';

            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.error('Failed to start recognition:', err);
                setVoiceError('Failed to start voice input. Please try again.');
                setTimeout(() => setVoiceError(''), 3000);
            }
        }
    }, [isListening, detectedLanguage]);

    // ── Auto-scroll ───────────────────────────────────────────
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

    // Format markdown-like text
    const formatMessage = (text) => {
        return text.split('\n').map((line, i) => {
            line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
            return (
                <span key={i}>
                    <span dangerouslySetInnerHTML={{ __html: line }} />
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            );
        });
    };

    // ── Send Message ──────────────────────────────────────────
    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        // Stop listening if active
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        const userMessage = input.trim();
        setInput('');
        setConnectionError(false);

        // Detect language of the message
        const isTamil = /[\u0B80-\u0BFF]/.test(userMessage);
        const msgLanguage = isTamil ? 'ta-IN' : 'en-IN';

        setMessages((prev) => [
            ...prev,
            {
                type: 'user',
                text: userMessage,
                timestamp: new Date(),
                language: msgLanguage,
            },
        ]);
        setIsLoading(true);

        try {
            const response = await axios.post(
                `${API_BASE_URL}/chat/farmer`,
                {
                    message: userMessage,
                    language: msgLanguage,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 35000,
                }
            );

            if (response.data.success) {
                setMessages((prev) => [
                    ...prev,
                    {
                        type: 'bot',
                        text: response.data.response,
                        timestamp: new Date(),
                    },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        type: 'bot',
                        text: `❌ ${response.data.error || 'Sorry, something went wrong.'}`,
                        timestamp: new Date(),
                        isError: true,
                    },
                ]);
            }
        } catch (error) {
            let errorMessage = '❌ Something went wrong. ';

            if (error.code === 'ECONNABORTED') {
                errorMessage += 'Request timed out.';
            } else if (error.response) {
                const { status, data } = error.response;
                if (status === 503) {
                    errorMessage = '🔧 AI service unavailable. Check backend.';
                } else if (status === 429) {
                    errorMessage = '⏳ Rate limit. Please wait.';
                } else {
                    errorMessage += data.error || `Error (${status})`;
                }
            } else if (error.request) {
                errorMessage = '🔌 Cannot connect to server.';
                setConnectionError(true);
            }

            setMessages((prev) => [
                ...prev,
                {
                    type: 'bot',
                    text: errorMessage,
                    timestamp: new Date(),
                    isError: true,
                },
            ]);
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
            await axios.post(`${API_BASE_URL}/chat/clear`, { role: 'farmer' });
        } catch { }
        setMessages([
            {
                type: 'bot',
                text: '🔄 Chat cleared! Ask me about today\'s market prices.\n\n\"இன்றைய காய்கறி விலை என்ன?\" or \"Today vegetable price?\"',
                timestamp: new Date(),
            },
        ]);
    };

    const suggestedPrompts = [
        { text: 'இன்றைய தக்காளி விலை என்ன?', emoji: '🍅' },
        { text: 'Today onion price', emoji: '🧅' },
        { text: 'Carrot rate in Chennai market', emoji: '🥕' },
        { text: 'உருளைக்கிழங்கு விலை', emoji: '🥔' },
    ];

    return (
        <div className="farmer-chatbot-page">
            {/* Header */}
            <div className="chatbot-header farmer-header">
                <div className="chatbot-header-inner">
                    <button onClick={() => navigate('/farmer-dashboard')} className="chatbot-back-btn" aria-label="Go back">
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Back</span>
                    </button>

                    <div className="chatbot-title-group">
                        <div className="chatbot-avatar farmer-avatar">
                            <IoLeaf className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="chatbot-title">Market Price Assistant</h1>
                            <p className="chatbot-subtitle-farmer">
                                🗣️ Tamil & English • Farmer
                            </p>
                        </div>
                    </div>

                    <button onClick={handleClearChat} className="chatbot-clear-btn" title="Clear chat">
                        <FiTrash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Connection / Voice Error Banners */}
            {connectionError && (
                <div className="chatbot-error-banner">
                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-bold text-sm">Connection Issue</p>
                        <p className="text-xs mt-1">Cannot connect to AI service.</p>
                    </div>
                    <button onClick={checkHealth} className="font-bold text-sm hover:underline">
                        Retry
                    </button>
                </div>
            )}

            {voiceError && (
                <div className="voice-error-banner">
                    <FiMicOff className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{voiceError}</p>
                </div>
            )}

            {/* Voice Listening Indicator */}
            {isListening && (
                <div className="voice-listening-overlay">
                    <div className="voice-listening-card">
                        <div className="voice-pulse-ring">
                            <div className="voice-pulse-inner">
                                <FiMic className="w-8 h-8" />
                            </div>
                        </div>
                        <p className="voice-listening-text">
                            Listening... 🎤
                        </p>
                        <p className="voice-listening-hint">
                            Speak in Tamil or English
                        </p>
                        {interimTranscript && (
                            <p className="voice-interim">{interimTranscript}</p>
                        )}
                        <button onClick={toggleListening} className="voice-stop-btn">
                            Stop Listening
                        </button>
                    </div>
                </div>
            )}

            {/* Messages Container */}
            <div className="chatbot-messages-container farmer-container">
                <div className="chatbot-messages">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`chatbot-message-row ${msg.type === 'user' ? 'user-row' : 'bot-row'}`}
                        >
                            <div
                                className={`chatbot-bubble ${msg.type === 'user'
                                        ? 'farmer-user-bubble'
                                        : msg.isError
                                            ? 'error-bubble'
                                            : 'farmer-bot-bubble'
                                    }`}
                            >
                                {msg.language && msg.type === 'user' && (
                                    <span className="language-badge">
                                        {msg.language === 'ta-IN' ? 'தமிழ்' : 'EN'}
                                    </span>
                                )}
                                <div className="bubble-text">
                                    {msg.type === 'bot' ? formatMessage(msg.text) : msg.text}
                                </div>
                                <p className="bubble-time">
                                    {msg.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="chatbot-message-row bot-row">
                            <div className="chatbot-bubble farmer-bot-bubble">
                                <div className="typing-indicator farmer-typing">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggested Prompts */}
                {messages.length === 1 && (
                    <div className="suggested-prompts">
                        <p className="suggested-label">Try asking / கேள்விகள்:</p>
                        <div className="suggested-grid">
                            {suggestedPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setInput(prompt.text)}
                                    className="suggested-btn farmer-suggested"
                                >
                                    <span className="text-xl">{prompt.emoji}</span>
                                    <span>{prompt.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area with Mic Button */}
            <div className="chatbot-input-area farmer-input-area">
                <div className="chatbot-input-inner">
                    {/* Mic Button */}
                    {voiceSupported && (
                        <button
                            onClick={toggleListening}
                            className={`mic-btn ${isListening ? 'mic-active' : ''}`}
                            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                            title={isListening ? 'Stop listening' : 'Tap to speak (Tamil / English)'}
                        >
                            {isListening ? (
                                <FiMicOff className="w-5 h-5" />
                            ) : (
                                <FiMic className="w-5 h-5" />
                            )}
                        </button>
                    )}

                    <div className="input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                voiceSupported
                                    ? '🎤 Tap mic or type your question...'
                                    : 'Type your question (e.g., tomato price today)...'
                            }
                            rows="1"
                            disabled={isLoading}
                            className="chatbot-textarea farmer-textarea"
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="chatbot-send-btn farmer-send-btn"
                        aria-label="Send message"
                    >
                        <FiSend className="w-5 h-5" />
                    </button>
                </div>
                <p className="input-hint">
                    {voiceSupported
                        ? '🎤 Voice: Tamil & English supported • ⌨️ Enter to send'
                        : 'Enter to send • Shift+Enter for new line'}
                </p>
            </div>

            <style>{`
        .farmer-chatbot-page {
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
          backdrop-filter: blur(16px);
          border-bottom: 1.5px solid var(--color-border);
        }

        .farmer-header {
          background: linear-gradient(135deg, rgba(27, 94, 32, 0.05), rgba(245, 127, 23, 0.05));
          background-color: var(--color-navbar-bg);
          box-shadow: 0 2px 20px rgba(245, 127, 23, 0.08);
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

        .farmer-avatar {
          background: linear-gradient(135deg, #E65100, #F57F17);
          color: white;
          box-shadow: 0 2px 12px rgba(245, 127, 23, 0.35);
        }

        .chatbot-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0;
          line-height: 1.2;
        }

        .chatbot-subtitle-farmer {
          font-size: 12px;
          color: #E65100;
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

        /* ── Error Banners ─────────────────────────── */
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

        .voice-error-banner {
          position: fixed;
          top: 75px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 44;
          width: calc(100% - 32px);
          max-width: 900px;
          padding: 10px 16px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FFF3E0;
          color: #E65100;
          border: 1px solid #FFE0B2;
          animation: fadeSlideIn 0.3s ease;
        }

        /* ── Voice Listening Overlay ───────────────── */
        .voice-listening-overlay {
          position: fixed;
          inset: 0;
          z-index: 60;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }

        .voice-listening-card {
          background: var(--color-surface);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          min-width: 300px;
          animation: scaleIn 0.3s ease;
        }

        .voice-pulse-ring {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(245, 127, 23, 0.1);
          animation: voicePulse 1.5s ease-in-out infinite;
        }

        .voice-pulse-inner {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #E65100, #F57F17);
          color: white;
          box-shadow: 0 4px 20px rgba(245, 127, 23, 0.4);
        }

        .voice-listening-text {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-text);
          margin: 0 0 6px;
        }

        .voice-listening-hint {
          font-size: 13px;
          color: var(--color-text-muted);
          margin: 0 0 16px;
        }

        .voice-interim {
          font-size: 15px;
          color: #E65100;
          font-weight: 600;
          padding: 10px 16px;
          background: rgba(245, 127, 23, 0.08);
          border-radius: 10px;
          margin: 0 0 16px;
          min-height: 40px;
          word-break: break-word;
        }

        .voice-stop-btn {
          padding: 10px 28px;
          border-radius: 999px;
          border: 2px solid #E65100;
          background: transparent;
          color: #E65100;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: var(--transition);
        }

        .voice-stop-btn:hover {
          background: #E65100;
          color: white;
        }

        @keyframes voicePulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 127, 23, 0.3); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 15px rgba(245, 127, 23, 0); }
        }

        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── Messages ──────────────────────────────── */
        .chatbot-messages-container {
          flex: 1;
          max-width: 900px;
          margin: 0 auto;
          width: 100%;
          padding: 90px 16px 140px;
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
          position: relative;
        }

        .farmer-user-bubble {
          background: linear-gradient(135deg, #E65100, #EF6C00);
          color: white;
          border-bottom-right-radius: 6px;
        }

        .farmer-bot-bubble {
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

        .language-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          margin-bottom: 6px;
        }

        .bubble-text {
          font-size: 14.5px;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .bubble-text strong { font-weight: 700; }

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
          animation: typingBounce 1.4s infinite ease-in-out;
        }

        .farmer-typing span {
          background: #E65100;
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

        .farmer-suggested {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .farmer-suggested:hover {
          background: #FFF3E0;
          border-color: #F57F17;
          color: #E65100;
          transform: translateY(-1px);
        }

        [data-theme="dark"] .farmer-suggested:hover {
          background: #2C1A00;
          border-color: #F57F17;
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

        .input-wrapper { flex: 1; }

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

        .farmer-textarea:focus {
          border-color: #E65100;
          box-shadow: 0 0 0 3px rgba(245, 127, 23, 0.12);
        }

        .chatbot-textarea::placeholder {
          color: var(--color-text-muted);
        }

        .chatbot-textarea:disabled { opacity: 0.5; }

        /* Mic Button */
        .mic-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 2px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: var(--transition);
        }

        .mic-btn:hover {
          border-color: #E65100;
          color: #E65100;
          background: #FFF3E0;
        }

        .mic-active {
          border-color: #E65100;
          background: #E65100;
          color: white;
          animation: micPulse 1.5s ease-in-out infinite;
        }

        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(230, 81, 0, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(230, 81, 0, 0); }
        }

        /* Send Button */
        .chatbot-send-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: var(--transition);
        }

        .farmer-send-btn {
          background: linear-gradient(135deg, #E65100, #EF6C00);
          color: white;
          box-shadow: 0 2px 10px rgba(230, 81, 0, 0.3);
        }

        .farmer-send-btn:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 4px 16px rgba(230, 81, 0, 0.4);
        }

        .farmer-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .farmer-send-btn:disabled {
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
          .voice-listening-card { padding: 30px 20px; min-width: auto; margin: 0 16px; }
        }
      `}</style>
        </div>
    );
};

export default FarmerChatbot;
