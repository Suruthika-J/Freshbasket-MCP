// frontend/src/components/BannerHome.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch, FiTruck, FiUsers } from 'react-icons/fi';
import { IoSparkles } from 'react-icons/io5';
import { GiFarmer } from 'react-icons/gi';
import { useNavigate } from 'react-router-dom';
import { bannerStyles } from '../assets/dummyStyles';
import { getFeatures } from '../assets/Dummy';

// Banner carousel images
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
  const navigate = useNavigate();

  // Check authentication status
  const isAuthenticated = Boolean(localStorage.getItem('authToken'));
  const userRole = localStorage.getItem('userRole');

  // Auto-rotate carousel every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedTerm = searchTerm.trim();

    if (trimmedTerm) {
      if (onSearch) {
        const searchWords = trimmedTerm.toLowerCase().split(/\s+/);
        onSearch(searchWords.join(' '));
      } else {
        navigate(`/items?search=${encodeURIComponent(trimmedTerm)}`);
      }
      setSearchTerm('');
    }
  };

  const handleCustomerLogin = () => {
    navigate('/login', { state: { intendedRole: 'customer' } });
  };

  const handleFarmerLogin = () => {
    navigate('/login', { state: { intendedRole: 'farmer' } });
  };

  return (
    <div className="relative overflow-hidden pt-16">
      {/* Background gradient */}
      <div className={bannerStyles.backgroundGradient}></div>

      {/* Decorative circles */}
      <div className="hidden sm:block absolute top-6 left-6 w-20 h-20 rounded-full bg-teal-100 opacity-30"></div>
      <div className="hidden md:block absolute bottom-12 right-28 w-32 h-32 rounded-full bg-seafoam-200 opacity-30"></div>
      <div className="hidden lg:block absolute top-1/3 right-1/4 w-16 h-16 rounded-full bg-mint-200 opacity-30"></div>

      <div className="relative z-10 mt-8 sm:mt-10 lg:mt-12 mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Image Carousel on the Left */}
          <div className="relative flex justify-center">
            <div className={`${bannerStyles.imageContainer} aspect-[4/3]`}>
              <div className={`${bannerStyles.imageInner} relative`}>
                {carouselImages.map((imageSrc, index) => (
                  <img
                    key={index}
                    src={imageSrc}
                    alt={`Carousel slide ${index + 1}`}
                    className={`absolute inset-0 object-cover w-full h-full transition-opacity duration-1000 ease-in-out ${
                      index === currentIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="hidden sm:block absolute -top-4 -right-4 w-20 h-20 rounded-full bg-mint-200 opacity-20"></div>
            <div className="hidden md:block absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-teal-100 opacity-20"></div>
            <div className="hidden lg:block absolute top-1/4 -left-6 w-20 h-20 rounded-full bg-seafoam-100 opacity-20"></div>
          </div>

          {/* Content on the Right */}
          <div className="text-center md:text-left">
            <div className={bannerStyles.tag}>
              <span className="flex items-center text-sm sm:text-base">
                <FiTruck className="mr-2" /> {t('banner.freeDelivery') || 'Free Delivery'}
              </span>
            </div>

            <h1 className={`${bannerStyles.heading} theme-text-maroon`}>
              {t('banner.heading1') || 'Fresh Groceries'}{' '}
              <span className={bannerStyles.headingItalic}>
                {t('banner.heading2') || 'Delivered'}
              </span>
              <br />
              {t('banner.heading3') || 'Right to Your'}{' '}
              <span className={bannerStyles.headingItalic}>
                {t('banner.heading4') || 'Doorstep'}
              </span>
            </h1>

            <p className={bannerStyles.paragraph}>
              {t('banner.subheading') || 'No Middleman – Direct from Farmers to You'}
            </p>

            {/* ========== CONDITIONAL CONTENT BASED ON AUTH STATUS ========== */}
            {isAuthenticated && userRole === 'user' ? (
              // ========== SEARCH BAR FOR LOGGED-IN CUSTOMERS ==========
              <>
                <form onSubmit={handleSubmit} className={bannerStyles.form}>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearch}
                    placeholder={t('banner.searchPlaceholder') || 'Search for fresh produce...'}
                    className={bannerStyles.input}
                  />
                  <button
                    type="submit"
                    className={bannerStyles.searchButton}
                  >
                    <FiSearch className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </form>

                {/* AI Recipe Assistant Button */}
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

                {/* Features Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                  {getFeatures(t).map((f, i) => (
                    <div
                      key={i}
                      className={bannerStyles.featureItem}
                    >
                      <div className="text-teal-600 mb-1">{f.icon}</div>
                      <span className={bannerStyles.featureText}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // ========== LOGIN BUTTONS FOR NON-AUTHENTICATED ==========
              <>
                <div className="mt-8 space-y-4">
                  {/* Customer Login Button */}
                  <button
                    onClick={handleCustomerLogin}
                    className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-emerald-500/50 transform hover:scale-105 transition-all duration-300"
                  >
                    <FiUsers className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Login as Customer</span>
                  </button>

                  {/* Farmer Login Button */}
                  <button
                    onClick={handleFarmerLogin}
                    className="w-full group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300"
                  >
                    <GiFarmer className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Login as Farmer</span>
                  </button>
                </div>

                {/* Info Text */}
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

// ============================================
// CHANGES MADE:
// ============================================
// 1. Removed search bar (not shown before login)
// 2. Removed AI Recipe Assistant button
// 3. Removed features grid
// 4. Added two prominent login buttons:
//    - "Login as Customer" (emerald/green theme)
//    - "Login as Farmer" (amber/orange theme)
// 5. Both buttons navigate to /login with state indicating intended role
// 6. Added info text explaining the platform for farmers and customers
// 7. Maintained carousel and visual design consistency