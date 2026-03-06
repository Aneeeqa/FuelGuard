import { NavLink } from 'react-router-dom';
import { Home, PlusCircle, History, Settings, Fuel, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import ThemeToggle from '../ui/ThemeToggle';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/add', icon: PlusCircle, label: 'Add Entry' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }}
    >
      {/* Logo/Brand */}
      <div
        className="flex items-center gap-3 h-16 px-6 border-b transition-colors duration-300"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--accent-blue)' }}>
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold" style={{ color: 'var(--text-primary)' }}>Fuel Guard</h1>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Theft Detection</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2'
              )
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'color-mix(in srgb, var(--accent-blue) 15%, transparent)' : 'transparent',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)'
            })}
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div
        className="px-4 py-4 border-t transition-colors duration-300"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between px-4 py-2">
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
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-300"
          style={{ backgroundColor: 'var(--bg-primary)' }}
        >
          <Fuel className="w-5 h-5" style={{ color: 'var(--accent-fuel)' }} />
          <div className="text-sm">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Fuel Guard</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
