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
        className="group relative flex items-center justify-center w-16 h-16 fb-btn-primary rounded-full shadow-2xl hover:animate-none p-0 flex-shrink-0"
        aria-label="Open Recipe Chatbot"
      >
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-full fb-primary-subtle opacity-75 animate-ping"></div>

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center">
          <FiMessageCircle className="w-8 h-8" />
          <IoSparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" />
        </div>

        {/* Tooltip */}
        {isHovered && (
          <div className="absolute left-full ml-4 px-4 py-2 fb-modal fb-text text-sm font-medium rounded-lg whitespace-nowrap shadow-xl border fb-border-primary">
            AI Recipe Assistant
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[var(--color-surface)]"></div>
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