//frontend/src/assets/Dummy.jsx
import { FiGift, FiHome, FiMail, FiPercent, FiShoppingBag, FiShoppingCart, FiTruck , FiPackage, FiCalendar, FiArrowDownCircle, FiArrowDownLeft} from "react-icons/fi";
import { bannerStyles } from './dummyStyles'

// Function to get translated nav items
export const getNavItems = (t) => [
    { name: t('nav.home'), path: '/', icon: <FiHome className="text-xl" /> },
    { name: t('nav.shop'), path: '/items', icon: <FiShoppingBag className="text-xl" /> },
    { name: t('nav.contact'), path: '/contact', icon: <FiMail className="text-xl" /> },
];

// Function to get translated features
export const getFeatures = (t) => [
    { icon: <FiTruck className={bannerStyles.featureIcon} />, text: t('banner.lightningDelivery') },
    { icon: <FiPercent className={bannerStyles.featureIcon} />, text: t('banner.pocketFriendly') },
    { icon: <FiHome className={bannerStyles.featureIcon} />, text: t('banner.returnEase') },
    { icon: <FiCalendar className={bannerStyles.featureIcon} />, text: t('banner.dealRush') },
];

// BANNER HOME - Keeping for backward compatibility, but using getFeatures(t) in BannerHome.jsx
export const features = [
    { icon: <FiTruck className={bannerStyles.featureIcon} />, text: '   Lightning Delivery' },
    { icon: <FiPercent className={bannerStyles.featureIcon} />, text: 'Pocket-Friendly' },
    { icon: <FiHome className={bannerStyles.featureIcon} />, text: 'ReturnEase' },
    { icon: <FiCalendar className={bannerStyles.featureIcon} />, text: 'Deal Rush' },
];


// NAVBAR - Keeping for backward compatibility, but using getNavItems(t) in Navbar.jsx
export const navItems = [
    { name: 'Home', path: '/', icon: <FiHome className="text-xl" /> },
    { name: 'Items', path: '/items', icon: <FiShoppingBag className="text-xl" /> },
    { name: 'Contact', path: '/contact', icon: <FiMail className="text-xl" /> },
     { name: 'My Orders', path: '/myorders', icon: <FiPackage className="text-xl" /> },
];
