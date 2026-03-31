import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * Animated Counter Component
 * @param {number} target - The number to reach
 * @param {number} duration - Animation duration in ms (default 2000)
 * @param {string} suffix - Suffix to add (e.g. "+", "%")
 * @param {string} label - The label below the number
 * @param {string} textColorClass - Tailwind or CSS class for the number color
 */
const Counter = ({ target, duration = 2000, suffix = "", label, textColorClass = "fb-text-primary" }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const counterRef = useRef(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.1 }
    );

    if (counterRef.current) {
      observer.observe(counterRef.current);
    }

    return () => {
      if (counterRef.current) {
        observer.unobserve(counterRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function: easeOutExpo
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easedProgress * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    window.requestAnimationFrame(step);
  }, [isVisible, target, duration]);

  return (
    <motion.div 
      ref={counterRef}
      className="fb-card rounded-2xl p-8 transform transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl text-center group cursor-default"
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
    >
      <div className={`text-5xl font-black mb-2 flex items-center justify-center ${textColorClass} group-hover:scale-110 transition-transform duration-300`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="fb-text-secondary text-lg font-bold tracking-wide uppercase opacity-80 group-hover:opacity-100 transition-opacity">
        {label}
      </div>
    </motion.div>
  );
};

export default Counter;
