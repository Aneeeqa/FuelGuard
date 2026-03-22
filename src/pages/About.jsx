import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Lock, Server, AlertTriangle, TrendingUp, Leaf, Users } from 'lucide-react';
import GlassCard from '../components/about/GlassCard';
import AnimatedCounter from '../components/about/AnimatedCounter';
import { BlueCTASection } from '../components/ui/hero-dithering-card';
import '../components/ui/GooeyText.css';

const About = () => {
  const bentoItems = [
    {
      title: 'Theft Detection',
      description: 'Advanced algorithms monitor mileage patterns to identify fuel theft in real-time, protecting your fleet from unauthorized fuel consumption.',
      icon: AlertTriangle,
      color: '#DC2626',
      hoverColor: 'rgba(220, 38, 38, 0.15)',
      span: 'col-span-1 md:col-span-2',
    },
    {
      title: 'Live Monitoring',
      description: 'Track fuel levels, consumption rates, and vehicle status with real-time dashboard updates and instant notifications.',
      icon: TrendingUp,
      color: '#2563EB',
      hoverColor: 'rgba(37, 99, 235, 0.15)',
      span: 'col-span-1 md:col-span-1',
    },
    {
      title: 'Carbon Tracking',
      description: 'Calculate and monitor carbon emissions across your fleet to meet sustainability goals and reduce environmental impact.',
      icon: Leaf,
      color: '#22C55E',
      hoverColor: 'rgba(34, 197, 94, 0.15)',
      span: 'col-span-1 md:col-span-1',
    },
    {
      title: 'Team Management',
      description: 'Assign drivers, manage vehicle access, and track performance metrics across your entire organization.',
      icon: Users,
      color: '#F59E0B',
      hoverColor: 'rgba(245, 158, 11, 0.15)',
      span: 'col-span-1 md:col-span-2',
    },
  ];

  const stats = [
    {
      value: 150000,
      suffix: '+',
      label: 'Gallons Protected',
      color: '#2563EB',
    },
    {
      value: 2500,
      suffix: '+',
      label: 'Theft Events Prevented',
      color: '#22C55E',
    },
    {
      value: 75,
      suffix: '%',
      label: 'Average Savings',
      color: '#F59E0B',
    },
    {
      value: 120,
      suffix: ' tons',
      label: 'CO₂ Emissions Reduced',
      color: '#22C55E',
    },
  ];

  const securityFeatures = [
    {
      icon: Shield,
      title: 'Export Data',
      description: 'Download your fuel logs as PDF or Excel files anytime.',
    },
    {
      icon: Lock,
      title: 'Secure Storage',
      description: 'All data is stored on firebase server and locally on your device.',
    },
    {
      icon: Server,
      title: 'Real-Time Protection',
      description: 'Smart algorithms analyze your fuel logs to detect suspicious consumption patterns and potential theft incidents.',
    },
  ];

  const teamMembers = [
    {
      id: 1,
      name: 'Hussam',
    },
    {
      id: 2,
      name: 'Aneeqa',
    },
    {
      id: 3,
      name: 'Ahmed',
    },
    {
      id: 4,
      name: 'Sumit',
    },
  ];

  return (
    <div className="min-h-screen bg-[#030b1c] relative overflow-hidden">

      {/* Hero Section — dithering CTA card */}
      <BlueCTASection />

      {/* Mission Bento Grid */}
      <section className="relative z-10 py-20 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 font-['Playfair_Display']"
              style={{ color: '#FFFFFF' }}
            >
              The Fuel Guard Mission
            </h2>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto font-['Plus_Jakarta_Sans']">
              Comprehensive fuel management designed for modern fleets
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bentoItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <GlassCard
                  key={index}
                  className={item.span}
                  hoverColor={item.hoverColor}
                  delay={index * 0.1}
                >
                  <div className="h-full flex flex-col">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: `${item.color}20`,
                        boxShadow: `0 0 30px ${item.color}40`,
                      }}
                    >
                      <Icon className="w-7 h-7" style={{ color: item.color }} />
                    </div>
                    <h3
                      className="text-2xl font-bold mb-3 font-['Plus_Jakarta_Sans']"
                      style={{ color: '#FFFFFF' }}
                    >
                      {item.title}
                    </h3>
                    <p className="text-[#9CA3AF] text-base leading-relaxed font-['Plus_Jakarta_Sans']">
                      {item.description}
                    </p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data & Analytics Section */}
      <section className="relative z-10 py-20 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 font-['Playfair_Display']"
              style={{ color: '#FFFFFF' }}
            >
              Impact & Analytics
            </h2>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto font-['Plus_Jakarta_Sans']">
              Real results that speak for themselves
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <GlassCard
                key={index}
                hoverColor={`${stat.color}20`}
                delay={index * 0.1}
              >
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div
                    className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 font-['Plus_Jakarta_Sans']"
                    style={{ color: stat.color }}
                  >
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-[#9CA3AF] text-lg font-['Plus_Jakarta_Sans']">
                    {stat.label}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust Section */}
      <section className="relative z-10 py-20 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 font-['Playfair_Display']"
              style={{ color: '#FFFFFF' }}
            >
              Security & Trust
            </h2>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto font-['Plus_Jakarta_Sans']">
              Your data security is our top priority
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <GlassCard key={index} delay={index * 0.15}>
                  <div className="h-full flex flex-col items-center text-center">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                      style={{
                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%)',
                        boxShadow: '0 0 40px rgba(37, 99, 235, 0.3)',
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className="w-8 h-8" style={{ color: '#60A5FA' }} />
                    </motion.div>
                    <h3
                      className="text-2xl font-bold mb-3 font-['Plus_Jakarta_Sans']"
                      style={{ color: '#FFFFFF' }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-[#9CA3AF] text-base leading-relaxed font-['Plus_Jakarta_Sans']">
                      {feature.description}
                    </p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative z-10 py-20 px-4 lg:px-8 pb-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold mb-4 font-['Playfair_Display']"
              style={{ color: '#FFFFFF' }}
            >
              Meet the Team
            </h2>
            <p className="text-[#9CA3AF] text-lg max-w-2xl mx-auto font-['Plus_Jakarta_Sans']">
              Built with passion
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <GlassCard key={member.id} delay={index * 0.1}>
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <motion.div
                    className="w-24 h-24 rounded-full mb-6 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
                      boxShadow: `0 0 40px ${index === 0 ? 'rgba(37, 99, 235, 0.4)' :
                                       index === 1 ? 'rgba(245, 158, 11, 0.4)' :
                                       index === 2 ? 'rgba(34, 197, 94, 0.4)' :
                                       'rgba(220, 38, 38, 0.4)'}`,
                    }}
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  >
                    <span className="text-4xl font-bold text-white">
                      {member.name.charAt(0)}
                    </span>
                  </motion.div>
                  <h3
                    className="text-2xl font-bold font-['Plus_Jakarta_Sans']"
                    style={{ color: '#FFFFFF' }}
                  >
                    {member.name}
                  </h3>
                  <p className="text-[#9CA3AF] text-sm mt-2 font-['Plus_Jakarta_Sans']">
                    Team Member
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Sign-in link */}
      <div className="relative z-10 text-center pb-16 px-4">
        <p className="text-[#9CA3AF] font-['Plus_Jakarta_Sans']">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold"
            style={{ color: '#60A5FA' }}
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default About;
