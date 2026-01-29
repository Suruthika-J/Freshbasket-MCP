import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaCheck, FaPhoneAlt, FaTag, FaComment, FaPaperPlane, FaMapMarkerAlt } from 'react-icons/fa';

// Import the map image from your assets folder
import mapImage from '../assets/kovilpatti-map.png';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [showToast, setShowToast] = useState(false);
  const whatsappNumber = '+91 7373728111';
  const kovilpattiLocationUrl = 'https://maps.app.goo.gl/DQSfdzyHKTrncQTT8';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, phone, subject, message } = formData;
    if (!name || !email || !phone || !subject || !message) {
      alert('Please fill all fields');
      return;
    }

    const text = 
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone}\n` +
      `Subject: ${subject}\n` +
      `Message: ${message}`;

    const url = 
      `https://web.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);

    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 right-8 z-50 animate-slide-in">
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-white rounded-full p-1">
              <FaCheck className="text-emerald-500 text-sm" />
            </div>
            <span className="font-semibold">Message opened in WhatsApp!</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Heading Section */}
        <div className="text-center mb-16">
          <div className="inline-block">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-4">
              Contact FreshGrocers
            </h1>
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-400 rounded-full"></div>
          </div>
          <p className="text-gray-600 mt-4 text-lg">We'd love to hear from you! Send us a message.</p>
        </div>

        {/* Two-column Grid Layout with Equal Heights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Contact Form - Left Side */}
          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8 h-full border border-emerald-100 flex flex-col">
              <form onSubmit={handleSubmit} className="flex flex-col flex-1">
                
                {/* Name Field */}
                <div className="mb-5">
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaUser className="text-emerald-500 text-lg" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-200 text-gray-800"
                      placeholder="Enter Your Name"
                      required
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="mb-5">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaEnvelope className="text-emerald-500 text-lg" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-200 text-gray-800"
                      placeholder="mailaccount@gmail.com"
                      required
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="mb-5">
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaPhoneAlt className="text-emerald-500 text-lg" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-200 text-gray-800"
                      placeholder="Your Phone Number"
                      required
                    />
                  </div>
                </div>

                {/* Subject Field */}
                <div className="mb-5">
                  <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FaTag className="text-emerald-500 text-lg" />
                    </div>
                    <input
                      id="subject"
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-200 text-gray-800"
                      placeholder="Order Inquiry"
                      required
                    />
                  </div>
                </div>

                {/* Message Field */}
                <div className="mb-6 flex-1 flex flex-col">
                  <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <div className="relative flex-1 flex flex-col">
                    <div className="absolute top-4 left-4 pointer-events-none z-10">
                      <FaComment className="text-emerald-500 text-lg" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full h-full min-h-[120px] pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all duration-200 text-gray-800 resize-none"
                      placeholder="Type your message here..."
                      required
                    ></textarea>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3 group"
                >
                  <span className="text-lg">Send Message via Whatsapp</span>
                  <FaPaperPlane className="text-lg group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </form>
            </div>
          </div>

          {/* Map Image Section - Right Side */}
          <div className="w-full">
            <div className="relative h-full rounded-2xl overflow-hidden shadow-xl border-4 border-white min-h-[650px] lg:min-h-full">
              <img 
                src={mapImage} 
                alt="Kovilpatti Map Location"
                className="w-full h-full object-cover"
              />
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              
              {/* Location Link Button */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                <a
                  href={kovilpattiLocationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-emerald-600 font-bold px-8 py-4 rounded-full shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 group border-2 border-emerald-500"
                >
                  <FaMapMarkerAlt className="text-xl group-hover:bounce" />
                  <span className="text-lg">Get Our Location</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaPhoneAlt className="text-emerald-600 text-2xl" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Call Us</h3>
            <p className="text-emerald-600 font-semibold">+91 7373728111</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-green-600 text-2xl" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Email Us</h3>
            <p className="text-green-600 font-semibold text-sm">suruthikajegadeesan@gmail.com</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-emerald-500 text-center hover:shadow-xl transition-shadow duration-200">
            <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMapMarkerAlt className="text-emerald-600 text-2xl" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Visit Us</h3>
            <p className="text-emerald-600 font-semibold">Kovilpatti, Tamil Nadu</p>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        .group:hover .group-hover\\:bounce {
          animation: bounce 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ContactUs;