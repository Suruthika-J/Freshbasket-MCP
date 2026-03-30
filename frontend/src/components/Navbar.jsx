///frontend/src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FiHome,
  FiShoppingBag,
  FiMail,
  FiUser,
  FiX,
  FiMenu,
  FiPackage,
  FiLogOut,
  FiSettings,
  FiSun,
  FiMoon,
  FiCalendar // ✅ NEW ICON for Meal Planner
} from 'react-icons/fi';
import { FaOpencart } from 'react-icons/fa';
import { useCart } from '../CartContext';
import { useTheme } from '../ThemeContext';
import logo from '../assets/logo.png';
import { navbarStyles } from '../assets/dummyStyles';
import { navItems, getNavItems } from '../assets/Dummy';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { theme, toggleTheme, isDark } = useTheme();
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(location.pathname);
  const [scrolled, setScrolled] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const prevCartCountRef = useRef(cartCount);
  const [cartBounce, setCartBounce] = useState(false);
  const profileDropdownRef = useRef(null);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem('authToken'))
  );
  const [userData, setUserData] = useState(null);

  // Mobile menu ref
  const mobileMenuRef = useRef(null);

  // Load user data
  useEffect(() => {
    const loadUserData = () => {
      const token = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');

      if (token && storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setIsLoggedIn(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          setIsLoggedIn(false);
          setUserData(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    };

    loadUserData();
  }, []);

  // Sync active tab & close mobile menu on route change
  useEffect(() => {
    setActiveTab(location.pathname);
    setIsOpen(false);
    setShowProfileDropdown(false);
  }, [location]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bounce cart icon when new item added
  useEffect(() => {
    if (cartCount > prevCartCountRef.current) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 1000);
      return () => clearTimeout(timer);
    }
    prevCartCountRef.current = cartCount;
  }, [cartCount]);

  // Listen for auth changes
  useEffect(() => {
    const handler = () => {
      const token = localStorage.getItem('authToken');
      const storedUserData = localStorage.getItem('userData');

      if (token && storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          setIsLoggedIn(true);
        } catch (error) {
          setIsLoggedIn(false);
          setUserData(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserData(null);
      }
    };
    window.addEventListener('authStateChanged', handler);
    return () => window.removeEventListener('authStateChanged', handler);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)) {
        setIsOpen(false);
      }

      // Close profile dropdown when clicking outside
      if (showProfileDropdown && profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showProfileDropdown]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setShowProfileDropdown(false);
    window.dispatchEvent(new Event('authStateChanged'));
    navigate('/login');
  };

  // ✅ UPDATED: Nav items with conditional "My Orders" and "Meal Planner" for logged-in users
  const getUpdatedNavItems = () => {
    const baseItems = getNavItems(t);

    // Add "My Orders" and "Meal Planner" after Shop link for logged-in users
    if (isLoggedIn) {
      const shopIndex = baseItems.findIndex(item => item.name === t('nav.shop'));
      if (shopIndex !== -1) {
        baseItems.splice(shopIndex + 1, 0,
          {
            name: t('nav.myOrders'),
            path: "/myorders",
            icon: <FiPackage />
          },
          {
            name: "Meal Planner", // ✅ NEW ITEM
            path: "/meal-planner",
            icon: <FiCalendar />
          }
        );
      }
    }

    return baseItems;
  };

  const updatedNavItems = getUpdatedNavItems();

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav
      className={`
        ${navbarStyles.nav}
        ${scrolled ? navbarStyles.scrolledNav : navbarStyles.unscrolledNav}
      `}
    >
      <div className={navbarStyles.borderGradient} />
      <div className={navbarStyles.particlesContainer}>
        <div
          className={`${navbarStyles.particle} w-24 h-24 bg-orange-500/5 -top-12 left-1/4 ${navbarStyles.floatAnimation}`}
        />
        <div
          className={`${navbarStyles.particle} w-32 h-32 bg-green-500/5 -bottom-16 left-2/3 ${navbarStyles.floatSlowAnimation}`}
        />
        <div
          className={`${navbarStyles.particle} w-16 h-16 bg-teal-500/5 -top-8 left-3/4 ${navbarStyles.floatSlowerAnimation}`}
        />
      </div>

      <div className={navbarStyles.container}>
        <div className={navbarStyles.innerContainer}>
          {/* Logo */}
          <Link to="/" className={navbarStyles.logoLink}>
            <img
              src={logo}
              alt="RushBasket Logo"
              className={`${navbarStyles.logoImage} ${scrolled ? 'h-10 w-10' : 'h-12 w-12'}`}
            />
            <span className={navbarStyles.logoText}>FreshBasket</span>
          </Link>

          {/* Desktop Nav */}
          <div className={navbarStyles.desktopNav}>
            {updatedNavItems.map(item => (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  ${navbarStyles.navItem}
                  ${activeTab === item.path
                    ? navbarStyles.activeNavItem
                    : navbarStyles.inactiveNavItem
                  }
                `}
              >
                <div className="flex items-center">
                  <span
                    className={`
                      ${navbarStyles.navIcon}
                      ${activeTab === item.path
                        ? navbarStyles.activeNavIcon
                        : navbarStyles.inactiveNavIcon
                      }
                    `}
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </div>
                <div
                  className={`
                    ${navbarStyles.navIndicator}
                    ${activeTab === item.path
                      ? navbarStyles.activeIndicator
                      : navbarStyles.inactiveIndicator
                    }
                  `}
                  style={activeTab === item.path ? { backgroundColor: 'var(--color-primary)' } : {}}
                />
              </Link>
            ))}
          </div>

          {/* Icons & Profile */}
          <div className={navbarStyles.iconsContainer}>

            {isLoggedIn && userData ? (
              // Profile dropdown when logged in
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg fb-primary-subtle border fb-border hover:opacity-90 transition-all duration-300"
                  aria-label="Profile menu"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-sm font-semibold shadow-lg">
                    {getUserInitials(userData.name)}
                  </div>
                  <span className="fb-text text-sm font-medium hidden sm:block">
                    {userData.name?.split(' ')[0] || t('nav.user')}
                  </span>
                </button>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 fb-modal z-50 overflow-hidden">
                    <div className="p-4 border-b fb-border">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                          {getUserInitials(userData.name)}
                        </div>
                        <div>
                          <h3 className="fb-text font-semibold">{userData.name}</h3>
                          <p className="fb-text-secondary text-sm">{userData.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      {/* Language Switcher in Profile Dropdown */}
                      <div className="px-4 py-3 border-b fb-border">
                        <LanguageSwitcher />
                      </div>

                      {/* Theme Toggle */}
                      <button
                        onClick={() => {
                          toggleTheme();
                          setShowProfileDropdown(false);
                        }}
                        className="w-full flex items-center px-4 py-3 fb-text-secondary hover:fb-text hover:fb-primary-subtle transition-all duration-200"
                      >
                        {isDark ? <FiSun className="mr-3 fb-text-primary" /> : <FiMoon className="mr-3 fb-text-primary" />}
                        <span className="fb-text">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                      </button>

                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-3 fb-text-secondary hover:fb-text hover:fb-primary-subtle transition-all duration-200"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <FiSettings className="mr-3 fb-text-primary" />
                        <span className="fb-text">{t('nav.profileSettings')}</span>
                      </Link>
                      <Link
                        to="/myorders"
                        className="flex items-center px-4 py-3 fb-text-secondary hover:fb-text hover:fb-primary-subtle transition-all duration-200"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <FiPackage className="mr-3 fb-text-primary" />
                        <span className="fb-text">{t('nav.myOrders')}</span>
                      </Link>
                      {/* ✅ NEW: Meal Planner Link in Dropdown */}
                      <Link
                        to="/meal-planner"
                        className="flex items-center px-4 py-3 fb-text-secondary hover:fb-text hover:fb-primary-subtle transition-all duration-200"
                        onClick={() => setShowProfileDropdown(false)}
                      >
                        <FiCalendar className="mr-3 fb-text-primary" />
                        <span className="fb-text">Meal Planner</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 fb-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                      >
                        <FiLogOut className="mr-3" />
                        <span>{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Login link when not logged in
              <Link to="/login" className={navbarStyles.loginLink}>
                <FiUser className={navbarStyles.loginIcon} />
                <span className="ml-1 fb-text-secondary group-hover:fb-text-primary font-medium transition-colors">
                  {t('nav.login')}
                </span>
              </Link>
            )}

            <Link
              to="/cart"
              className={navbarStyles.cartLink}
              aria-label={`Cart (${cartCount} items)`}
            >
              <FaOpencart
                className={`${navbarStyles.cartIcon} ${cartBounce ? 'scale-125' : ''} transition-transform duration-300`}
              />
              {cartCount > 0 && (
                <span
                  className={navbarStyles.cartBadge}
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className={navbarStyles.hamburgerButton}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? (
                <FiX className="h-6 w-6 fb-text" />
              ) : (
                <FiMenu className="h-6 w-6 fb-text" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`
          ${navbarStyles.mobileOverlay}
          ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}
          fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300
        `}
        onClick={() => setIsOpen(false)}
      >
        <div
          ref={mobileMenuRef}
          className={`
            ${navbarStyles.mobilePanel}
            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
            fixed right-0 top-0 bottom-0 z-50 w-4/5 max-w-sm
          `}
          onClick={e => e.stopPropagation()}
        >
          <div className={navbarStyles.mobileHeader}>
            <div className={navbarStyles.mobileLogo}>
              <div className="flex items-center space-x-2">
                <img
                  src={logo}
                  alt="FreshBasket Logo"
                  className="h-8 w-8 object-contain"
                />
                <span className="text-xl font-bold tracking-tight fb-text-primary">FreshBasket</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-3 fb-text-secondary hover:fb-surface-alt rounded-full transition-colors active:scale-95"
              aria-label="Close menu"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile Profile Section */}
          {isLoggedIn && userData && (
            <div className="p-4 border-b fb-border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center text-white text-lg font-semibold shadow-lg">
                  {getUserInitials(userData.name)}
                </div>
                <div>
                  <h3 className="fb-text font-semibold">{userData.name}</h3>
                  <p className="fb-text-secondary text-sm">{userData.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Language Switcher */}
          <div className="p-4 border-b fb-border">
            <LanguageSwitcher />
          </div>

          <div className={navbarStyles.mobileItemsContainer}>
            {updatedNavItems.map((item, idx) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center w-full p-4 rounded-xl transition-all duration-300 font-medium active:scale-95 ${activeTab === item.path ? 'bg-emerald-50 text-emerald-600 shadow-sm border border-emerald-100' : 'text-gray-600 hover:bg-gray-50'}`}
                style={{
                  transitionDelay: isOpen ? `${idx * 100}ms` : '0ms',
                  opacity: isOpen ? 1 : 0,
                  transform: `translateX(${isOpen ? 0 : '15px'})`,
                }}
                onClick={() => setIsOpen(false)}
              >
                <span className={`mr-3 text-xl ${activeTab === item.path ? 'text-emerald-500' : 'text-gray-400'}`}>{item.icon}</span>
                <span className="text-base">{item.name}</span>
              </Link>
            ))}

            {/* Mobile Profile Settings for logged in users */}
            {isLoggedIn && (
              <Link
                to="/profile"
                className={navbarStyles.mobileItem}
                style={{
                  transitionDelay: isOpen ? `${updatedNavItems.length * 100}ms` : '0ms',
                  opacity: isOpen ? 1 : 0,
                  transform: `translateX(${isOpen ? 0 : '20px'})`,
                }}
                onClick={() => setIsOpen(false)}
              >
                <span className={navbarStyles.mobileItemIcon}><FiSettings /></span>
                <span className={navbarStyles.mobileItemText}>{t('nav.profileSettings')}</span>
              </Link>
            )}

            <div className={navbarStyles.mobileButtons}>
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className={navbarStyles.loginButton}
                >
                  <FiLogOut className={navbarStyles.loginButtonIcon} />
                  {t('nav.logout')}
                </button>
              ) : (
                <Link
                  to="/login"
                  className={navbarStyles.loginButton}
                  onClick={() => setIsOpen(false)}
                >
                  <FiUser className={navbarStyles.loginButtonIcon} />
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{navbarStyles.customCSS}</style>
    </nav>
  );
}