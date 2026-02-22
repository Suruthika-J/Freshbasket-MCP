///frontend/ src/components/Footer.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaEnvelope,
  FaMobileAlt,
  FaMapMarkerAlt,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaCcAmex,
  FaApplePay
} from 'react-icons/fa';
import { BiMailSend } from 'react-icons/bi';
import { BsTelephone } from 'react-icons/bs';
import { FiLink, FiBookmark, FiMail } from 'react-icons/fi';

const Footer = () => {
  const { t } = useTranslation();

  const socialLinks = [
    { icon: FaFacebookF, url: 'https://www.facebook.com/' },
    { icon: FaTwitter, url: 'https://twitter.com/' },
    { icon: FaInstagram, url: 'https://www.instagram.com/' },
    { icon: FaYoutube, url: 'https://www.youtube.com/' }
  ];

  return (
    <footer
      className="pt-12 pb-8 relative overflow-hidden border-t-4"
      style={{ backgroundColor: 'var(--color-footer-bg)', color: 'var(--color-footer-text)', borderTopColor: 'var(--color-primary)' }}
    >
      {/* Floating shapes */}
      <div className="hidden lg:block absolute -top-24 -right-24 w-80 h-80 rounded-full opacity-10"
        style={{ backgroundColor: 'var(--color-primary-light)' }} />
      <div className="hidden lg:block absolute -bottom-40 -left-24 w-96 h-96 rounded-full opacity-10"
        style={{ backgroundColor: 'var(--color-primary)' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-wider mb-4">
              Fresh<span style={{ color: 'var(--color-primary-light)' }}>BASKET</span>
            </h2>
            <p className="mb-6 leading-relaxed text-sm sm:text-base opacity-80">
              {t('footer.brandDescription')}
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, idx) => (
                <a
                  key={idx}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-transform transform hover:-translate-y-1 shadow-md"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
                  aria-label={`Visit our ${social.icon.name?.replace('Fa', '')} page`}
                >
                  <social.icon className="text-white" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 pb-2 border-b-2 inline-flex items-center"
              style={{ borderBottomColor: 'var(--color-primary-light)' }}>
              <FiLink className="mr-2 opacity-70" /> {t('footer.quickLinks')}
            </h3>
            <ul className="space-y-2 text-sm sm:text-base">
              {[t('nav.home'), t('nav.shop'), t('nav.contact')].map((item, idx) => (
                <li key={idx}>
                  <a href={`/${item.toLowerCase()}`} className="flex items-center group opacity-80 hover:opacity-100 transition-opacity">
                    <span className="inline-block w-2 h-2 rounded-full mr-3 group-hover:scale-125 transition-transform"
                      style={{ backgroundColor: 'var(--color-primary-light)' }} />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 pb-2 border-b-2 inline-flex items-center"
              style={{ borderBottomColor: 'var(--color-primary-light)' }}>
              <BsTelephone className="mr-2 opacity-70" /> {t('footer.contactUs')}
            </h3>
            <ul className="space-y-4 text-sm sm:text-base">
              <li className="flex items-start">
                <div className="mt-1 p-2 rounded-lg mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <FaMapMarkerAlt style={{ color: 'var(--color-primary-light)' }} />
                </div>
                <div><p className="opacity-80">123 Organic Valley, Green City, GC 54321</p></div>
              </li>
              <li className="flex items-start">
                <div className="mt-1 p-2 rounded-lg mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <FaMobileAlt style={{ color: 'var(--color-primary-light)' }} />
                </div>
                <div><p className="opacity-80">+91 7373728111</p></div>
              </li>
              <li className="flex items-start">
                <div className="mt-1 p-2 rounded-lg mr-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                  <FaEnvelope style={{ color: 'var(--color-primary-light)' }} />
                </div>
                <div><p className="opacity-80">suruthikajegadeesan@gmail.com</p></div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xl sm:text-2xl font-bold mb-4 pb-2 border-b-2 inline-flex items-center"
              style={{ borderBottomColor: 'var(--color-primary-light)' }}>
              <FiMail className="mr-2 opacity-70" /> {t('footer.newsletter')}
            </h3>
            <p className="opacity-80 mb-4 text-sm sm:text-base">{t('footer.newsletterText')}</p>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className="w-full sm:flex-1 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none px-4 py-2 focus:outline-none mb-2 sm:mb-0 text-gray-800"
                style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}
              />
              <button
                className="w-full sm:w-auto px-4 py-2 rounded-b-xl sm:rounded-r-xl sm:rounded-bl-none flex items-center justify-center transition-transform transform hover:-translate-y-1 text-white font-semibold"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <BiMailSend className="mr-2 text-lg" />
                <span>{t('footer.subscribe')}</span>
              </button>
            </div>
            <p className="opacity-60 text-xs sm:text-sm">{t('footer.privacyText')}</p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t-2 border-white/10 pt-6">
          <h4 className="opacity-70 mb-4 font-medium flex items-center justify-center text-sm sm:text-base">
            <FiBookmark className="mr-2 opacity-70 text-lg" /> {t('footer.paymentMethods')}
          </h4>
          <div className="flex flex-wrap justify-center gap-4">
            {[FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcAmex, FaApplePay].map((Icon, idx) => (
              <div key={idx} className="p-3 rounded-lg hover:opacity-100 opacity-70 transition-all transform hover:-translate-y-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                <Icon className="text-2xl text-white" />
              </div>
            ))}
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full border border-white/20 shadow-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
            <div className="relative mr-3">
              <div className="w-6 h-6 rounded-sm transform rotate-45" style={{ backgroundColor: 'var(--color-primary)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-white transform -rotate-45" />
              </div>
            </div>
            <span className="opacity-80 text-sm sm:text-base">
              Designed by{' '}
              <a
                href="www.linkedin.com/in/suruthika-jegadeesan"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline hover:opacity-100 opacity-90"
              >
                FreshBasket
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;