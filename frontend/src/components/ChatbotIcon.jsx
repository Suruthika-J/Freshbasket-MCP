import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';

const ChatbotIcon = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate('/recipe-chatbot');
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-110 animate-pulse hover:animate-none"
        aria-label="Open Recipe Chatbot"
      >
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-75 animate-ping"></div>
        
        {/* Icon */}
        <div className="relative z-10 text-white">
          <FiMessageCircle className="w-7 h-7" />
          <IoSparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
        </div>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute left-full ml-4 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg whitespace-nowrap shadow-xl border border-emerald-500/30">
            AI Recipe Assistant
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-gray-900"></div>
          </div>
        )}
      </button>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatbotIcon;