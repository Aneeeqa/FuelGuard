import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Droplets, Shield, TrendingUp, ArrowRight } from 'lucide-react';

export default function Home() {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center animate-fade-in-up">
          <img
            src="/logo.png"
            alt="FuelGuard Logo"
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6"
          />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Fuel Guard
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Protect your vehicle from fuel theft and optimize your fuel efficiency with smart monitoring
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              className="px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 hover-lift active-scale bg-gradient-fuel shadow-glow-fuel inline-flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover-lift active-scale inline-flex items-center gap-2"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '2px solid var(--border-color)'
              }}
            >
              Sign In
            </Link>
          </div>
        </div>

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

        <div className="mt-16 text-center">
          <p style={{ color: 'var(--text-muted)' }}>
            Ready to protect your vehicle?{' '}
            <Link to="/signup" className="font-semibold hover-scale" style={{ color: 'var(--accent-fuel)' }}>
              Create a free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
