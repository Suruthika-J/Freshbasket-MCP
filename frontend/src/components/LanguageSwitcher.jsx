import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/30 hover:from-teal-500/30 hover:to-emerald-500/30 transition-all duration-300 backdrop-blur-sm"
        aria-label={t('common.language')}
      >
        <FiGlobe className="w-5 h-5 text-teal-300" />
        <span className="text-white text-sm font-medium hidden sm:block">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
        <FiChevronDown className={`w-4 h-4 text-teal-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Language Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-teal-500/30 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="py-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center px-4 py-3 text-left transition-all duration-200 ${
                  i18n.language === lang.code
                    ? 'bg-teal-500/20 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-teal-500/10'
                }`}
              >
                <span className="mr-3 text-xl">{lang.flag}</span>
                <span className="font-medium">{lang.name}</span>
                {i18n.language === lang.code && (
                  <span className="ml-auto text-teal-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;