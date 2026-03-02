import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../ChatContext';
import { format } from 'date-fns';
import { FiSend, FiMic, FiMicOff, FiGlobe, FiInfo } from 'react-icons/fi';
import useVoiceRecognition, { SUPPORTED_LANGUAGES } from '../hooks/useVoiceRecognition';

const FarmerChat = () => {
    const { messages, sendMessage, getOrCreateFarmerChat, socket } = useChat();
    const [newMessage, setNewMessage] = useState('');
    const [currentChat, setCurrentChat] = useState(null);
    const [selectedLang, setSelectedLang] = useState('auto');
    const messagesEndRef = useRef(null);

    // Voice recognition
    const {
        isListening,
        toggleListening,
        interimTranscript,
        isSupported: voiceSupported
    } = useVoiceRecognition({
        language: selectedLang,
        onResult: (transcript) => {
            setNewMessage(prev => prev ? prev + ' ' + transcript : transcript);
        }
    });

    useEffect(() => {
        const initChat = async () => {
            const chat = await getOrCreateFarmerChat();
            if (chat) setCurrentChat(chat);
        };
        initChat();
    }, [getOrCreateFarmerChat]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (newMessage.trim() && currentChat) {
            if (!socket || !socket.connected) {
                alert('🔌 Chat server not connected. Please refresh.');
                return;
            }
            sendMessage(currentChat._id, newMessage.trim());
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-xl border fb-border overflow-hidden transition-all">
            {/* Header */}
            <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm">
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3 border border-green-200">
                        <i className="fas fa-headset text-green-600"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Farmer Support</h3>
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                {socket?.connected ? 'Online' : 'Disconnected'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#F8F9FA] flex flex-col space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 max-w-xs mx-auto">
                        <div className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center mb-5 border border-gray-100">
                            <FiInfo className="text-3xl text-green-500" />
                        </div>
                        <h4 className="font-bold text-gray-800">Need Assistance?</h4>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            Send a message to our admin team. We'll help you with order issues, pricing, or technical support.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderRole === 'farmer';
                        return (
                            <div
                                key={msg._id || index}
                                className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${isMe
                                        ? 'bg-[#E3F2FD] border-[#BBDEFB] self-end rounded-tr-none ml-auto'
                                        : 'bg-white border-white self-start rounded-tl-none'
                                    }`}
                            >
                                <p className="text-sm text-gray-800 leading-relaxed font-medium">{msg.text}</p>
                                <div className={`flex items-center gap-2 mt-2 ${isMe ? 'justify-end' : ''}`}>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                {interimTranscript && (
                    <div className="self-end bg-blue-50 text-blue-600 italic text-xs px-3 py-2 rounded-lg border border-blue-100 max-w-[80%]">
                        🎤 {interimTranscript}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Voice Control & Input Area */}
            <div className="p-4 bg-white border-t">
                {/* Language Selector */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                        <FiGlobe className="text-gray-400 w-4 h-4" />
                        <select
                            value={selectedLang}
                            onChange={(e) => setSelectedLang(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-600 text-[11px] rounded-lg px-2 py-1 outline-none focus:border-green-400 font-bold"
                        >
                            <option value="auto">🌐 AUTO</option>
                            <option value="tamil">தமிழ்</option>
                            <option value="english">ENGLISH</option>
                            <option value="hindi">हिन्दी</option>
                            <option value="malayalam">മലയാളം</option>
                            <option value="telugu">తెలుగు</option>
                            <option value="kannada">ಕನ್ನಡ</option>
                        </select>
                    </div>
                    {isListening && (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                            <span className="text-[10px] font-bold text-red-500 uppercase">Listening...</span>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex-1 relative">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type or use 🎤 for voice typing..."
                            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:border-green-500 focus:bg-white outline-none text-sm transition-all resize-none max-h-32 min-h-[48px]"
                            rows="1"
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                        />
                        {/* Mic Button Inline */}
                        {voiceSupported && (
                            <button
                                type="button"
                                onClick={toggleListening}
                                className={`absolute right-3 bottom-3 transition-all ${isListening ? 'text-red-500 scale-110' : 'text-gray-400 hover:text-green-500'}`}
                            >
                                {isListening ? <FiMicOff size={18} /> : <FiMic size={18} />}
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`p-3.5 rounded-2xl flex items-center justify-center transition-all ${!newMessage.trim()
                                ? 'bg-gray-100 text-gray-300'
                                : 'bg-green-600 text-white shadow-lg hover:shadow-green-200 hover:scale-105 active:scale-95'
                            }`}
                    >
                        <FiSend size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FarmerChat;
