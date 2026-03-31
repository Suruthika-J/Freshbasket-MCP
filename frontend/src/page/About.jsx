import React from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiHeart, FiStar, FiZap, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { aboutStyles } from '../assets/dummyStyles';
import heroImg from '../assets/about_hero.png';
import missionImg from '../assets/about_mission.png';

const About = () => {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const stagger = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.2 }
  };

  return (
    <div className="min-h-screen fb-bg">
      {/* Hero Section */}
      <section className={aboutStyles.heroSection}>
        <div className={aboutStyles.blob + " w-72 h-72 bg-green-200 -top-20 -left-20"}></div>
        <div className={aboutStyles.blob + " w-96 h-96 bg-orange-200 -bottom-32 -right-32"}></div>

        <div className={aboutStyles.heroContainer}>
          <motion.div
            className={aboutStyles.heroTextContent}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className={aboutStyles.heroTitle}>
              Harvesting <span className={aboutStyles.heroHighlight}>Happiness</span>,
              One Basket at a Time.
            </h1>
            <p className={aboutStyles.heroTagline}>
              We connect local farmers directly to your kitchen, ensuring you get the freshest produce while supporting our hard-working agricultural community.
            </p>
            <button
              onClick={() => {
                const token = localStorage.getItem('authToken');
                navigate(token ? '/items' : '/login');
              }}
              className="fb-btn-primary px-8 py-4 text-lg shadow-lg hover:shadow-green-200/50"
            >
              Start Shopping
            </button>
          </motion.div>

          <motion.div
            className={aboutStyles.heroIllustration}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <img src={heroImg} alt="Hero" className="w-full max-w-lg animate-fb-float" />
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={aboutStyles.missionSection}>
        <div className={aboutStyles.missionContainer}>
          <motion.div
            className={aboutStyles.missionText}
            {...fadeIn}
          >
            <div className="flex items-center gap-2 mb-4">
              <FiTarget className="text-fb-primary text-2xl" />
              <span className="font-bold text-fb-primary uppercase tracking-widest text-sm">Our Mission</span>
            </div>
            <h2 className={aboutStyles.missionTitle}>Connecting Soil to Soul</h2>
            <p className={aboutStyles.missionParagraph}>
              At FreshBasket, our mission is simple yet profound: to eliminate the middlemen and bring the farm's bounty directly to your doorstep. We believe everyone deserves access to healthy, locally-grown food without breaking the bank.
            </p>
            <p className={aboutStyles.missionParagraph}>
              By empowering local farmers with a digital platform, we're not just selling vegetables; we're growing a sustainable future for our community.
            </p>
          </motion.div>

          <motion.div
            className="md:w-1/2"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img src={missionImg} alt="Mission" className="rounded-[2.5rem] shadow-2xl border-8 fb-border" />
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className={aboutStyles.whyChooseSection}>
        <div className="container mx-auto px-4 text-center mb-16">
          <motion.h2 className="text-3xl md:text-5xl font-black fb-text mb-4" {...fadeIn}>
            Why Choose FreshBasket?
          </motion.h2>
          <motion.p className="fb-text-secondary max-w-2xl mx-auto" {...fadeIn}>
            We combine technology with tradition to provide you with a shopping experience that's as fresh as our produce.
          </motion.p>
        </div>

        <motion.div
          className={aboutStyles.grid + " container mx-auto px-4"}
          variants={stagger}
          initial="initial"
          whileInView="whileInView"
        >
          <FeatureCard
            icon={<FiZap />}
            title="Express Delivery"
            text="From the farm to your door in under 24 hours. Freshness guaranteed."
            color="bg-orange-100"
          />
          <FeatureCard
            icon={<FiHeart />}
            title="Farm Direct"
            text="Every product is sourced directly from verified local farmers."
            color="bg-green-100"
          />
          <FeatureCard
            icon={<FiDollarSign />}
            title="Fair Pricing"
            text="Reduced supply chains mean better prices for you and better pay for farmers."
            color="bg-blue-100"
          />
        </motion.div>
      </section>

      {/* Features List */}
      <section className="py-20 fb-bg-secondary/30">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div className={aboutStyles.featureItem} {...fadeIn}>
            <FiStar className={aboutStyles.featureIcon} />
            <div>
              <h4 className="font-bold fb-text">Top Quality</h4>
              <p className="text-sm fb-text-secondary">Strict quality checks for every batch.</p>
            </div>
          </motion.div>
          <motion.div className={aboutStyles.featureItem} {...fadeIn}>
            <FiShoppingBag className={aboutStyles.featureIcon} />
            <div>
              <h4 className="font-bold fb-text">Wide Variety</h4>
              <p className="text-sm fb-text-secondary">From exotic fruits to daily staples.</p>
            </div>
          </motion.div>
          <motion.div className={aboutStyles.featureItem} {...fadeIn}>
            <FiZap className={aboutStyles.featureIcon} />
            <div>
              <h4 className="font-bold fb-text">Eco-Friendly</h4>
              <p className="text-sm fb-text-secondary">Minimal plastic packaging, maximal love.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className={aboutStyles.teamSection}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black fb-text mb-4">Our Visionaries</h2>
            <p className="fb-text-secondary">MEET THE TEAM WHO MAKES THE FRESHNESS HAPPEN.</p>
          </div>

          <div className={aboutStyles.teamGrid}>
            <TeamMember name="Pragdeesh" role="Founder & CEO" />
            <TeamMember name="Raghav" role="Operations Lead" />
            <TeamMember name="Ragul" role="Head of Quality" />
            <TeamMember name="Suruthika" role="Logistics Manager" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section
        className={aboutStyles.ctaSection}
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <h2 className={aboutStyles.ctaTitle}>Ready to taste the freshness?</h2>
        <button
          onClick={() => navigate('/signup')}
          className={aboutStyles.ctaButton}
        >
          Join Our Community
        </button>
      </motion.section>
    </div>
  );
};

const FeatureCard = ({ icon, title, text, color }) => (
  <motion.div
    className={aboutStyles.card}
    variants={{
      initial: { opacity: 0, y: 20 },
      whileInView: { opacity: 1, y: 0 }
    }}
  >
    <div className={`${aboutStyles.cardIcon} ${color}`}>
      {icon}
    </div>
    <h3 className={aboutStyles.cardTitle}>{title}</h3>
    <p className={aboutStyles.cardText}>{text}</p>
  </motion.div>
);

const TeamMember = ({ name, role }) => (
  <div className={aboutStyles.teamMember}>
    <div className={aboutStyles.teamAvatar}>
      <div className="w-full h-full bg-fb-primary-subtle flex items-center justify-center text-4xl font-black text-fb-primary">
        {name[0]}
      </div>
    </div>
    <h4 className={aboutStyles.teamName}>{name}</h4>
    <p className={aboutStyles.teamRole}>{role}</p>
  </div>
);

export default About;
