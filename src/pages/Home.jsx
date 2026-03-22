import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Shield, TrendingUp, ArrowRight, AlertTriangle, Leaf, Users, Lock, Server } from 'lucide-react';
import { CTASection } from '../components/ui/hero-dithering-card';
import About from './About';
import GlassCard from '../components/about/GlassCard';
import AnimatedCounter from '../components/about/AnimatedCounter';
import PublicNavBar from '../components/layout/PublicNavBar';

export default function Home() {
  const { isDark } = useTheme();
  const [showBlue, setShowBlue] = useState(true);

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    
    const style = document.createElement('style');
    style.textContent = `
      body::-webkit-scrollbar {
        width: 0px !important;
        display: none !important;
      }
      html::-webkit-scrollbar {
        width: 0px !important;
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
      document.head.removeChild(style);
    };
  }, []);

  return (
    <>
      <PublicNavBar
        showToggle
        toggleValue={showBlue}
        onToggle={() => setShowBlue(v => !v)}
        isBlue={showBlue}
      />

      <AnimatePresence mode="wait">
        {showBlue ? (
          <motion.div
            key="blue"
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(14px)' }}
            transition={{ duration: 0.38, ease: 'easeInOut' }}
            style={{ paddingTop: '60px', background: '#030b1c' }}
          >
            <About />
          </motion.div>
        ) : (
          <motion.div
            key="orange"
            initial={{ opacity: 0, filter: 'blur(14px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(14px)' }}
            transition={{ duration: 0.38, ease: 'easeInOut' }}
          >
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          paddingTop: '60px',
          background: 'linear-gradient(160deg, #1a0800 0%, #0d0500 40%, #110400 100%)',
        }}
      >
      <CTASection />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fade-in-up delay-200">
          <div className="glass rounded-2xl p-6 hover-lift" style={{ backgroundColor: 'var(--bg-glass)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-blue-glow)' }}>
              <Shield size={24} className="text-blue-500" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Fuel Theft Detection</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Monitor your fuel levels and detect unauthorized drainage instantly with real-time alerts
            </p>
          </div>

          <div className="glass rounded-2xl p-6 hover-lift" style={{ backgroundColor: 'var(--bg-glass)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-fuel-glow)' }}>
              <TrendingUp size={24} className="text-amber-500" style={{ color: 'var(--accent-fuel)' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Efficiency Tracking</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Track mileage, fuel consumption, and costs to optimize your vehicle's performance
            </p>
          </div>

          <div className="glass rounded-2xl p-6 hover-lift" style={{ backgroundColor: 'var(--bg-glass)' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--accent-success-glow)' }}>
              <Droplets size={24} className="text-green-500" style={{ color: 'var(--accent-success)' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Smart Analytics</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Visualize your fuel data with detailed charts and insights for better decision making
            </p>
          </div>
        </div>

        {/* ── The Fuel Guard Mission ── */}
        <section className="py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #EA580C 0%, #FB923C 60%, #FDBA74 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'Playfair Display, Georgia, serif',
            }}>
              The Fuel Guard Mission
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Comprehensive fuel management designed for modern fleets
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Theft Detection', description: 'Advanced algorithms monitor mileage patterns to identify fuel theft in real-time, protecting your fleet from unauthorized fuel consumption.', Icon: AlertTriangle, color: '#DC2626', hoverColor: 'rgba(220,38,38,0.15)', span: 'col-span-1 md:col-span-2' },
              { title: 'Live Monitoring', description: 'Track fuel levels, consumption rates, and vehicle status with real-time dashboard updates and instant notifications.', Icon: TrendingUp, color: '#EA580C', hoverColor: 'rgba(234,88,12,0.15)', span: 'col-span-1 md:col-span-1' },
              { title: 'Carbon Tracking', description: 'Calculate and monitor carbon emissions across your fleet to meet sustainability goals and reduce environmental impact.', Icon: Leaf, color: '#22C55E', hoverColor: 'rgba(34,197,94,0.15)', span: 'col-span-1 md:col-span-1' },
              { title: 'Team Management', description: 'Assign drivers, manage vehicle access, and track performance metrics across your entire organization.', Icon: Users, color: '#F59E0B', hoverColor: 'rgba(245,158,11,0.15)', span: 'col-span-1 md:col-span-2' },
            ].map((item, index) => {
              const Icon = item.Icon;
              return (
                <GlassCard key={index} className={item.span} hoverColor={item.hoverColor} delay={index * 0.1}>
                  <div className="h-full flex flex-col">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${item.color}20`, boxShadow: `0 0 30px ${item.color}40` }}>
                      <Icon className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.description}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* ── Impact & Analytics ── */}
        <section className="py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #EA580C 0%, #FB923C 60%, #FDBA74 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'Playfair Display, Georgia, serif',
            }}>
              Impact & Analytics
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Real results that speak for themselves
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { value: 150000, suffix: '+', label: 'Gallons Protected', color: '#EA580C' },
              { value: 2500, suffix: '+', label: 'Theft Events Prevented', color: '#F59E0B' },
              { value: 75, suffix: '%', label: 'Average Savings', color: '#22C55E' },
              { value: 120, suffix: ' tons', label: 'CO₂ Emissions Reduced', color: '#22C55E' },
            ].map((stat, index) => (
              <GlassCard key={index} hoverColor={`${stat.color}20`} delay={index * 0.1}>
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4" style={{ color: stat.color }}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-lg" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Security & Trust ── */}
        <section className="py-20">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #EA580C 0%, #FB923C 60%, #FDBA74 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'Playfair Display, Georgia, serif',
            }}>
              Security & Trust
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Your data security is our top priority
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: Shield, title: 'Export Data', description: 'Download your fuel logs as PDF or Excel files anytime' },
              { Icon: Lock, title: 'Secure Storage', description: 'All data is stored on firebase server and locally on your device.' },
              { Icon: Server, title: 'Real-Time Protection', description: 'Smart algorithms analyze your fuel logs to detect suspicious consumption patterns and potential theft incidents.' },
            ].map((feature, index) => {
              const FeatureIcon = feature.Icon;
              return (
                <GlassCard key={index} hoverColor="rgba(234,88,12,0.12)" delay={index * 0.15}>
                  <div className="h-full flex flex-col items-center text-center">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(234,88,12,0.2) 0%, rgba(251,146,60,0.2) 100%)',
                        boxShadow: '0 0 40px rgba(234,88,12,0.3)',
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <FeatureIcon className="w-8 h-8" style={{ color: '#FB923C' }} />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                    <p className="text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>{feature.description}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* ── Meet the Team ── */}
        <section className="py-20 pb-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
              background: 'linear-gradient(135deg, #EA580C 0%, #FB923C 60%, #FDBA74 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: 'Playfair Display, Georgia, serif',
            }}>
              Meet the Team
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
              Built with passion
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
               { id: 1, name: 'Hussam', glowColor: 'rgba(234,88,12,0.4)' },
               { id: 2, name: 'Aneeqa', glowColor: 'rgba(245,158,11,0.4)' },
               { id: 3, name: 'Ahmed', glowColor: 'rgba(34,197,94,0.4)' },
               { id: 4, name: 'Sumit', glowColor: 'rgba(220,38,38,0.4)' },
             ].map((member, index) => (
              <GlassCard key={member.id} hoverColor="rgba(234,88,12,0.1)" delay={index * 0.1}>
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <motion.div
                    className="w-24 h-24 rounded-full mb-6 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #EA580C 0%, #FB923C 100%)',
                      boxShadow: `0 0 40px ${member.glowColor}`,
                    }}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <span className="text-4xl font-bold text-white">{member.name.charAt(0)}</span>
                  </motion.div>
                  <h3 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{member.name}</h3>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Team Member</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        <div className="mt-8 text-center pb-16">
          <p style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover-scale" style={{ color: 'var(--accent-fuel)' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
