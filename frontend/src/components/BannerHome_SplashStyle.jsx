// frontend/src/components/BannerHome_SplashStyle.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiTruck, FiUsers } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import { GiFarmer } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { bannerStyles } from '../assets/dummyStyles';
import { getFeatures } from '../assets/Dummy';

import BannerFood from '../assets/FoodBanner.png';
import BannerFood2 from '../assets/FoodBanner2.png';
import BannerFood3 from '../assets/FoodBanner3.png';
import BannerFood4 from '../assets/FoodBanner4.png';
import BannerFood5 from '../assets/FoodBanner5.png';
import BannerFood6 from '../assets/FoodBanner6.png';

const carouselImages = [BannerFood2, BannerFood4, BannerFood3, BannerFood5, BannerFood6, BannerFood];

const BannerHome = ({ onSearch }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = Boolean(localStorage.getItem('authToken'));
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm) {
      if (onSearch) {
        onSearch(trimmedTerm.toLowerCase().split(/\s+/).join(' '));
      } else {
        navigate(`/items?search=${encodeURIComponent(trimmedTerm)}`);
      }
      setSearchTerm('');
    }
  };

  const handleCustomerLogin = () => navigate('/login', { state: { intendedRole: 'customer' } });
  const handleFarmerLogin = () => navigate('/login', { state: { intendedRole: 'farmer' } });

  return (
    <div className="relative overflow-hidden pt-16">
      <div className={bannerStyles.backgroundGradient}></div>

      <div className="hidden sm:block absolute top-6 left-6 w-20 h-20 rounded-full bg-teal-100 opacity-30"></div>
      <div className="hidden md:block absolute bottom-12 right-28 w-32 h-32 rounded-full bg-seafoam-200 opacity-30"></div>
      <div className="hidden lg:block absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-mint-200 opacity-30"></div>

      <div className="relative z-10 mt-8 sm:mt-10 lg:mt-12 mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* SPLASH/TORN PAPER EFFECT CAROUSEL */}
          <div className="relative flex justify-center">
            <div 
              className="relative w-full max-w-md group cursor-pointer"
              onMouseEnter={() => setIsAutoPlay(false)}
              onMouseLeave={() => setIsAutoPlay(true)}
            >
              {/* Irregular Splash Shape Container */}
              <div className="relative aspect-square overflow-hidden shadow-2xl transition-all duration-700 group-hover:shadow-emerald-500/50 group-hover:rotate-1" 
                   style={{
                     clipPath: 'polygon(5% 10%, 15% 2%, 30% 5%, 45% 0%, 60% 3%, 75% 8%, 88% 5%, 95% 15%, 98% 30%, 95% 45%, 98% 60%, 93% 75%, 95% 88%, 88% 95%, 75% 93%, 60% 98%, 45% 95%, 30% 93%, 15% 98%, 8% 88%, 2% 75%, 5% 60%, 0% 45%, 3% 30%, 2% 15%)'
                   }}>
                {carouselImages.map((imageSrc, index) => (
                  <img
                    key={index}
                    src={imageSrc}
                    alt={`Fresh produce ${index + 1}`}
                    className={`absolute inset-0 object-cover w-full h-full transition-all duration-700 ease-in-out ${
                      index === currentIndex 
                        ? 'opacity-100 scale-100 group-hover:scale-105' 
                        : 'opacity-0 scale-95'
                    }`}
                  />
                ))}
                
                {/* Paint splash overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>

              {/* Multi-layered border effect */}
              <div 
                className="absolute inset-0 border-3 border-emerald-400/60 transition-all duration-700 group-hover:border-emerald-500 group-hover:scale-105"
                style={{
                  clipPath: 'polygon(5% 10%, 15% 2%, 30% 5%, 45% 0%, 60% 3%, 75% 8%, 88% 5%, 95% 15%, 98% 30%, 95% 45%, 98% 60%, 93% 75%, 95% 88%, 88% 95%, 75% 93%, 60% 98%, 45% 95%, 30% 93%, 15% 98%, 8% 88%, 2% 75%, 5% 60%, 0% 45%, 3% 30%, 2% 15%)'
                }}
              ></div>

              {/* Splatter Badge */}
              <div className="absolute -bottom-6 -right-6 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                <div className="relative"
                     style={{
                       clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 60%, 90% 80%, 80% 100%, 30% 100%, 10% 90%, 0% 70%, 0% 30%)'
                     }}>
                  <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 text-white font-extrabold px-8 py-4 shadow-2xl">
                    <div className="text-xs">🌟</div>
                    <div className="text-sm">FRESH</div>
                  </div>
                </div>
              </div>

              {/* Splatter Indicators */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3">
                {carouselImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`transition-all duration-300 relative ${
                      index === currentIndex 
                        ? 'w-10 h-4' 
                        : 'w-4 h-4'
                    }`}
                  >
                    <div 
                      className={`w-full h-full ${
                        index === currentIndex 
                          ? 'bg-white' 
                          : 'bg-white/50 hover:bg-white/75'
                      }`}
                      style={{
                        clipPath: index === currentIndex 
                          ? 'polygon(10% 0%, 90% 0%, 100% 30%, 95% 70%, 85% 100%, 15% 100%, 5% 70%, 0% 30%)'
                          : 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Irregular decorative splatter shapes */}
            <div className="hidden sm:block absolute -top-8 -right-8 w-28 h-28 bg-mint-200 opacity-40"
                 style={{
                   clipPath: 'polygon(50% 0%, 80% 10%, 100% 35%, 100% 70%, 80% 90%, 50% 100%, 20% 90%, 0% 70%, 0% 35%, 20% 10%)'
                 }}></div>
            <div className="hidden md:block absolute -bottom-8 -left-8 w-36 h-36 bg-teal-200 opacity-40"
                 style={{
                   clipPath: 'polygon(25% 0%, 75% 0%, 100% 25%, 100% 75%, 75% 100%, 25% 100%, 0% 75%, 0% 25%)'
                 }}></div>
            <div className="hidden lg:block absolute top-1/3 -right-4 w-20 h-20 bg-seafoam-200 opacity-40"
                 style={{
                   clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)'
                 }}></div>
          </div>

          {/* Content Section */}
          <div className="text-center md:text-left">
            <div className={bannerStyles.tag}>
              <span className="flex items-center text-sm sm:text-base">
                <FiTruck className="mr-2" /> {t('banner.freeDelivery') || 'Free Delivery'}
              </span>
            </div>

            <h1 className={`${bannerStyles.heading} theme-text-maroon`}>
              {t('banner.heading1') || 'Fresh Groceries'}{' '}
              <span className={bannerStyles.headingItalic}>{t('banner.heading2') || 'Delivered'}</span>
              <br />
              {t('banner.heading3') || 'Right to Your'}{' '}
              <span className={bannerStyles.headingItalic}>{t('banner.heading4') || 'Doorstep'}</span>
            </h1>

            <p className={bannerStyles.paragraph}>
              {t('banner.subheading') || 'No Middleman – Direct from Farmers to You'}
            </p>

            {isAuthenticated && userRole === 'user' ? (
              <>
                <form onSubmit={handleSubmit} className={bannerStyles.form}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder={t('banner.searchPlaceholder') || 'Search for fresh produce...'}
                    className={bannerStyles.input}
                  />
                  <button type="submit" className={bannerStyles.searchButton}>
                    <FiSearch className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </form>

                <div className="mt-6 flex justify-center md:justify-start">
                  <button
                    onClick={() => navigate('/recipe-chatbot')}
                    className="group relative inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-full shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
                  >
                    <IoSparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>{t('banner.aiRecipeButton') || 'AI Recipe Assistant'}</span>
                    <div className="absolute -top-2 -right-2 bg-yellow-300 text-xs text-gray-900 font-bold px-2.5 py-1 rounded-full shadow-lg border-2 border-white">
                      {t('banner.newBadge') || 'NEW'}
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  {getFeatures(t).map((f, i) => (
                    <div key={i} className={bannerStyles.featureItem}>
                      <div className="text-teal-600 mb-1">{f.icon}</div>
                      <span className={bannerStyles.featureText}>{f.text}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mt-8 space-y-4">
                  <button
                    onClick={handleCustomerLogin}
                    className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
                  >
                    <FiUsers className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Login as Customer</span>
                  </button>

                  <button
                    onClick={handleFarmerLogin}
                    className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300"
                  >
                    <GiFarmer className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Login as Farmer</span>
                  </button>
                </div>

                <div className="mt-6 text-center md:text-left">
                  <p className="text-sm text-gray-600">
                    🌾 <strong>Farmers:</strong> Sell your produce directly to customers
                  </p>
                  <p className="text-sm text-gray-600">
                    🛒 <strong>Customers:</strong> Buy fresh farm produce at the best prices
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerHome;

