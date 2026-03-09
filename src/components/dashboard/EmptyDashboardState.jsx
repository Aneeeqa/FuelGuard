import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Zap, TrendingUp, Wallet, AlertTriangle, Leaf } from 'lucide-react';
import { useFuelData } from '../../hooks/useFuelData';

const EmptyDashboardState = () => {
  const navigate = useNavigate();
  const { injectDemoData } = useFuelData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [demoSuccess, setDemoSuccess] = useState(false);

  const handleGenerateDemo = () => {
    setIsGenerating(true);
    setTimeout(() => {
      injectDemoData();
      setIsGenerating(false);
      setDemoSuccess(true);
      setTimeout(() => {
        setDemoSuccess(false);
      }, 2000);
    }, 800);
  };

  const handleAddEntry = () => {
    navigate('/add');
  };

  const features = [
    {
      icon: AlertTriangle,
      title: 'Theft Detection',
      description: 'Automatic alerts for unusual fuel drain and mileage drops',
      color: 'var(--accent-alert)'
    },
    {
      icon: TrendingUp,
      title: 'Mileage Tracking',
      description: 'Track your fuel efficiency over time with detailed charts',
      color: 'var(--accent-blue)'
    },
    {
      icon: Wallet,
      title: 'Cost Analysis',
      description: 'Monitor spending patterns and budget tracking',
      color: 'var(--accent-success)'
    },
    {
      icon: Leaf,
      title: 'Carbon Footprint',
      description: 'Track environmental impact and CO₂ emissions',
      color: '#22c55e'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Main Welcome Section */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 animate-bounce"
          style={{
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-success) 100%)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          <Droplet size={48} weight="duotone" color="white" />
        </div>

        <h1 className="text-3xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Welcome to Fuel Guard
        </h1>

        <p className="text-lg lg:text-xl mb-2" style={{ color: 'var(--text-secondary)' }}>
          Your Personal Fuel Tracking & Theft Detection System
        </p>

        <p className="text-base max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Start tracking your fuel consumption to uncover efficiency insights, detect potential theft,
          and monitor your vehicle's performance over time.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        {/* Generate Demo Data Button */}
        <button
          onClick={handleGenerateDemo}
          disabled={isGenerating}
          className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold text-white transition-all hover-lift active-scale min-h-[64px] relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, #3b82f6 100%)',
            boxShadow: 'var(--shadow-glow-blue)',
            opacity: isGenerating ? 0.7 : 1,
            cursor: isGenerating ? 'wait' : 'pointer'
          }}
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generating Data...</span>
            </>
          ) : demoSuccess ? (
            <>
              <Zap size={24} weight="fill" />
              <span>Demo Data Generated! ✓</span>
            </>
          ) : (
            <>
              <Zap size={24} weight="duotone" />
              <span>🎲 Generate Demo Data</span>
            </>
          )}
        </button>

        {/* Add Entry Button */}
        <button
          onClick={handleAddEntry}
          className="flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all hover-lift active-scale min-h-[64px]"
          style={{
            backgroundColor: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '2px solid var(--border-color)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <Droplet size={24} weight="duotone" />
          <span>Add Your First Entry</span>
        </button>
      </div>

      {/* Demo Data Info Card */}
      {!isGenerating && !demoSuccess && (
        <div
          className="rounded-xl p-6 mb-16 border-2 border-dashed animate-fade-in-up"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--accent-blue) 8%, transparent)',
            borderColor: 'color-mix(in srgb, var(--accent-blue) 30%, transparent)'
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'color-mix(in srgb, var(--accent-blue) 20%, transparent)' }}
            >
              <Zap size={28} weight="duotone" style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                Try Demo Mode
              </h3>
              <p className="text-base mb-3" style={{ color: 'var(--text-secondary)' }}>
                Generate realistic sample data with <strong className="font-bold" style={{ color: 'var(--accent-alert)' }}>3 fuel theft alerts</strong> and 
                <strong className="font-bold" style={{ color: 'var(--accent-blue)' }}> tank-to-tank trips</strong> to explore all features immediately.
                Perfect for testing and demonstrations!
              </p>
              <div className="flex flex-wrap gap-2 text-sm">
                {['30 entries', '3 theft alerts', 'Tank-to-tank trips', 'Realistic trends', 'Random each time'].map((feature, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)',
                      color: 'var(--accent-blue)'
                    }}
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="rounded-xl p-6 transition-all hover-lift border"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--card-shadow)',
              animationDelay: `${(index + 1) * 100}ms`
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
              style={{
                backgroundColor: `color-mix(in srgb, ${feature.color} 15%, transparent)`
              }}
            >
              <feature.icon size={32} weight="duotone" style={{ color: feature.color }} />
            </div>
            <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
              {feature.title}
            </h3>
            <p className="text-base" style={{ color: 'var(--text-muted)' }}>
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Tip */}
      <div
        className="mt-12 p-4 rounded-lg text-center"
        style={{ backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="font-semibold" style={{ color: 'var(--accent-warning)' }}>💡 Pro Tip:</span>{' '}
          Add at least 2-3 entries to see meaningful trends and statistics. The more you log, the better the insights!
        </p>
      </div>
    </div>
  );
};

export default EmptyDashboardState;
