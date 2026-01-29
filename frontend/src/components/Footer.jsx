///frontend/ src/components/Footer.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaEnvelope,
  FaMobileAlt ,
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
import { footerStyles } from "../assets/dummyStyles";

const Footer = () => {
  const { t } = useTranslation();

  // Social media links with their respective URLs
  const socialLinks = [
    {
      icon: FaFacebookF,
      url: 'https://www.facebook.com/'
    },
    {
      icon: FaTwitter,
      url: 'https://twitter.com/'
    },
    {
      icon: FaInstagram,
      url: 'https://www.instagram.com/'
    },
    {
      icon: FaYoutube,
      url: 'https://www.youtube.com/'
    }
  ];

  return (
    <footer className={footerStyles.footer}>
      {/* Decorative backgrounds - hide on small screens */}
      <div className={footerStyles.topBorder}></div>

      {/* Floating shapes */}
      <div className={`${footerStyles.floatingShape} -top-24 -right-24 w-80 h-80 opacity-20`}></div>
      <div className={`${footerStyles.floatingShape} -bottom-40 -left-24 w-96 h-96 opacity-15 animation-delay-2000`}></div>
      <div className={`${footerStyles.floatingShape} top-1/4 left-1/3 w-64 h-64 bg-emerald-600 opacity-10 animate-pulse animation-delay-1000`}></div>

      <div className={footerStyles.container}>
        <div className={footerStyles.grid}>
          {/* Brand */}
          <div>
            <h2 className={footerStyles.brandTitle}>
              Fresh<span className={footerStyles.brandSpan}>BASKET</span>
            </h2>
            <p className={footerStyles.brandText}>
              {t('footer.brandDescription')}
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, idx) => (
                <a 
                  key={idx} 
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerStyles.socialLink}
                  aria-label={`Visit our ${social.icon.name.replace('Fa', '')} page`}
                >
                  <social.icon className={footerStyles.socialIcon} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={footerStyles.sectionTitle}>
              <FiLink className={footerStyles.sectionIcon} /> {t('footer.quickLinks')}
            </h3>
            <ul className={footerStyles.linkList}>
              {[t('nav.home'), t('nav.shop'), t('nav.contact')].map((item, idx) => (
                <li key={idx}>
                  <a href={`/${item.toLowerCase()}`} className={footerStyles.linkItem}>
                    <span className={footerStyles.linkBullet}></span>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className={footerStyles.sectionTitle}>
              <BsTelephone className={footerStyles.sectionIcon} /> {t('footer.contactUs')}
            </h3>
            <ul className="space-y-4 text-sm sm:text-base">
              <li className={footerStyles.contactItem}>
                <div className={footerStyles.contactIconContainer}>
                  <FaMapMarkerAlt className={footerStyles.contactIcon} />
                </div>
                <div>
                  <p>123 Organic Valley, Green City, GC 54321</p>
                </div>
              </li>
              <li className={footerStyles.contactItem}>
                <div className={footerStyles.contactIconContainer}>
                  <FaMobileAlt className={footerStyles.contactIcon} />
                </div>
                <div>
                  <p>+91 7373728111</p>
                </div>
              </li>
              <li className={footerStyles.contactItem}>
                <div className={footerStyles.contactIconContainer}>
                  <FaEnvelope className={footerStyles.contactIcon} />
                </div>
                <div>
                  <p>suruthikajegadeesan@gmail.com</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className={footerStyles.sectionTitle}>
              <FiMail className={footerStyles.sectionIcon} /> {t('footer.newsletter')}
            </h3>
            <p className={footerStyles.newsletterText}>
              {t('footer.newsletterText')}
            </p>
            <div className={footerStyles.newsletterForm}>
              <input
                type="email"
                placeholder={t('footer.emailPlaceholder')}
                className={footerStyles.newsletterInput}
              />
              <button className={footerStyles.newsletterButton}>
                <BiMailSend className="mr-2 text-lg" />
                <span>{t('footer.subscribe')}</span>
              </button>
            </div>
            <p className={footerStyles.privacyText}>
              {t('footer.privacyText')}
            </p>
          </div>
        </div>

        {/* Payment Methods */}
        <div className={footerStyles.paymentSection}>
          <h4 className={footerStyles.paymentTitle}>
            <FiBookmark className={footerStyles.paymentIcon} /> {t('footer.paymentMethods')}
          </h4>
          <div className={footerStyles.paymentMethods}>
            {[FaCcVisa, FaCcMastercard, FaCcPaypal, FaCcAmex, FaApplePay].map((Icon, idx) => (
              <div key={idx} className={footerStyles.paymentItem}>
                <Icon className={footerStyles.paymentIcon} />
              </div>
            ))}
          </div>
        </div>

        {/* Attribution */}
        <div className={footerStyles.attribution}>
          <div className={footerStyles.attributionBadge}>
            <div className={footerStyles.hexagonContainer}>
              <div className={footerStyles.hexagon}></div>
              <div className={footerStyles.hexagonInner}>
                <div className={footerStyles.hexagonInnerShape}></div>
              </div>
            </div>
            <span className={footerStyles.attributionText}>
              Designed by{' '}
              <a
                href="www.linkedin.com/in/suruthika-jegadeesan"
                target="_blank"
                rel="noopener noreferrer"
                className={footerStyles.attributionLink}
              >
                Freshbasket
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{footerStyles.customCSS}</style>
    </footer>
  );
};

export default Footer;