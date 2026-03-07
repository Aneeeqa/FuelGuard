import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, History, Settings, Fuel, Shield, Zap, Truck } from 'lucide-react';
import { clsx } from 'clsx';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/add', icon: PlusCircle, label: 'Add Entry' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/fleet', icon: Truck, label: 'Fleet' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r transition-all duration-300"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-xl)'
      }}
    >
      {/* Logo/Brand */}
      <div
        className="flex items-center gap-3 h-16 px-6 border-b hover-lift"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
          style={{ 
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-glow-blue)'
          }}
        >
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold gradient-text-primary" style={{ color: 'var(--accent-blue)' }}>Fuel Guard</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Theft Detection</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'hover-lift active-scale',
                isActive && 'shadow-md'
              )
            }
            style={({ isActive }) => ({
              backgroundColor: isActive 
                ? 'color-mix(in srgb, var(--accent-blue) 15%, transparent)' 
                : 'transparent',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              borderColor: isActive ? 'var(--accent-blue)' : 'transparent',
              borderWidth: isActive ? '1px' : '0',
            })}
          >
            <Icon 
              className="w-5 h-5 transition-transform duration-200"
              strokeWidth={2}
            />
            <span className="relative">
              {label}
              {to === '/add' && (
                <span className="absolute -top-1 -right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Quick Stats Summary */}
      <div className="mx-4 mb-4 p-4 rounded-xl animate-fade-in" style={{ 
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-blue) 10%, var(--bg-primary)) 0%, color-mix(in srgb, var(--accent-blue) 5%, var(--bg-primary)) 100%)',
        border: '1px solid color-mix(in srgb, var(--accent-blue) 20%, transparent)'
      }}>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--accent-blue)' }}>Quick Stats</span>
        </div>
        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Active</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monitoring theft detection</p>
      </div>

      {/* Theme Toggle */}
      <div
        className="px-4 py-4 border-t transition-colors duration-300"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between px-4 py-2 rounded-xl hover-lift" style={{ 
          backgroundColor: 'var(--bg-primary)'
        }}>
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Theme</span>
          <ThemeToggle />
        </div>
      </div>

      {/* Footer */}
      <div
        className="p-4 border-t transition-colors duration-300"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover-lift"
          style={{ 
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ 
            background: 'var(--gradient-fuel)',
            boxShadow: 'var(--shadow-glow-fuel)'
          }}>
            <Fuel className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Fuel Guard</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
